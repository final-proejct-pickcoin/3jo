from elasticsearch import Elasticsearch

# ES 연결 객체 생성 (환경/보안에 맞게 설정)
es = Elasticsearch(
    hosts=["http://elasticsearch:9200"],  # docker 환경/실제 환경에 맞게 수정
    request_timeout=30
)

# 기간별 사용자 추이
def get_user_trend(interval="month"):
    """
    interval: "hour", "day", "week", "month"
    Returns date-wise unique user count list
    """
    # ES 집계 쿼리
    body = {
        "size": 0,
        "aggs": {
            "by_date": {
                "date_histogram": {
                    "field": "@timestamp",
                    "calendar_interval": interval,
                    "time_zone": "Asia/Seoul"
                },
                "aggs": {
                    "unique_users": {
                        "cardinality": {
                            "field": "email.keyword"  # 매핑에 맞춰 수정
                        }
                    }
                }
            }
        }
    }
    res = es.search(index="register-logs", body=body)
    result = []
    for bucket in res["aggregations"]["by_date"]["buckets"]:
        result.append({
            "date": bucket["key_as_string"],       # yyyy-MM-ddTHH:mm:ss+09:00
            "count": bucket["unique_users"]["value"]
        })
    return result

# 전체 거래대금 가져오기
def get_trading_volume_trend(interval="hour"):
    body = {
                "size": 0,
                "aggs": {
                    "by_date": {
                        "date_histogram": {
                            "field": "@timestamp",
                            "calendar_interval": interval,
                            "time_zone": "Asia/Seoul"
                        },
                        "aggs": {
                            "trading_volume": {
                                "sum": {
                                    "script": {
                                        "source": """
                                            if (!doc['price.keyword'].empty && !doc['amount.keyword'].empty) {
                                                try {
                                                    double p = Double.parseDouble(doc['price.keyword'].value);
                                                    double a = Double.parseDouble(doc['amount.keyword'].value);
                                                    return p * a;
                                                } catch(Exception e) {
                                                    return 0;
                                                }
                                            } else {
                                                return 0;
                                            }
                                        """
                                    }
                                }
                            }
                        }
                    }
                }
            }
    res = es.search(index="trade-logs", body=body)
    result = []
    for bucket in res["aggregations"]["by_date"]["buckets"]:
        result.append({
            "date": bucket["key_as_string"],
            "volume": bucket["trading_volume"]["value"]
        })
    return result


# 전체 로그 가져오기
def fetch_logs_from_es(index: str = "login-logs", size: int = 50):
    body = {
        "sort": [
            {"@timestamp": {"order": "desc"}}
        ],
        "query": {"match_all": {}},
        "size": size
    }
    res = es.search(index="login-logs,register-logs,trade-logs,logout-logs,buy-logs,sell-logs", body=body)
    logs = []
    for hit in res["hits"]["hits"]:
        source = hit["_source"]
        logs.append({
            "id": hit["_id"],
            "timestamp": source.get("@timestamp"),
            "level": source.get("level", "info"),
            "user": source.get("email") if source.get("email") else source.get("user_id", "-"),
            "action": source.get("event_type", "-"),
            "ip": source.get("ip", "-"),
            "status": source.get("status", "성공"),
        })
    return logs

