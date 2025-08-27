from elasticsearch import Elasticsearch
import time
import asyncio

# ES 연결 객체 생성 (환경/보안에 맞게 설정)
es = Elasticsearch(
    hosts=["http://elasticsearch:9200"],  # docker 환경/실제 환경에 맞게 수정
    request_timeout=30
)

# ES 실행될 때까지 대기
async def wait_for_es(timeout=60, interval=1):
    """
    비동기 방식으로 Elasticsearch가 준비될 때까지 대기
    """
    start = asyncio.get_event_loop().time()
    while True:
        try:
            if es.ping():
                print("Elasticsearch is ready")
                return True
        except Exception as e:
            print(f"ES ping failed: {e}")
        if asyncio.get_event_loop().time() - start > timeout:
            raise TimeoutError("Elasticsearch not ready after timeout")
        await asyncio.sleep(interval)

# 인덱스 없으면 생성
def create_indices_if_not_exist():
    """
    필요한 인덱스가 없으면 자동 생성
    """
    indices_to_create = {
        "login-logs": {
            "mappings": {
                "properties": {
                    "@timestamp": {"type": "date"},
                    "email": {"type": "text", "fields": {"keyword": {"type": "keyword"}}},
                    "event_type": {"type": "text", "fields": {"keyword": {"type": "keyword"}}},
                    "ip": {"type": "ip"},
                    "status": {"type": "text", "fields": {"keyword": {"type": "keyword"}}},
                    "level": {"type": "text", "fields": {"keyword": {"type": "keyword"}}},
                    "user_id": {"type": "text", "fields": {"keyword": {"type": "keyword"}}},
                }
            }
        },
        "register-logs": {
            "mappings": {
                "properties": {
                    "@timestamp": {"type": "date"},
                    "email": {"type": "text", "fields": {"keyword": {"type": "keyword"}}},
                    "event_type": {"type": "text", "fields": {"keyword": {"type": "keyword"}}},
                    "level": {"type": "text", "fields": {"keyword": {"type": "keyword"}}},
                }
            }
        },
        "trade-logs": {
            "mappings": {
                "properties": {
                    "@timestamp": {"type": "date"},
                    "coin_name": {"type": "text", "fields": {"keyword": {"type": "keyword"}}},
                    "amount": {"type": "text", "fields": {"keyword": {"type": "keyword"}}},
                    "price": {"type": "text", "fields": {"keyword": {"type": "keyword"}}},
                    "event_type": {"type": "text", "fields": {"keyword": {"type": "keyword"}}},
                }
            }
        },
        "logout-logs": {
            "mappings": {
                "properties": {
                    "@timestamp": {"type": "date"},
                    "email": {"type": "text", "fields": {"keyword": {"type": "keyword"}}},
                    "event_type": {"type": "text", "fields": {"keyword": {"type": "keyword"}}},
                    "level": {"type": "text", "fields": {"keyword": {"type": "keyword"}}},
                }
            }
        },
        "buy-logs": {
            "mappings": {
                "properties": {
                    "@timestamp": {"type": "date"},
                    "coin_name": {"type": "text", "fields": {"keyword": {"type": "keyword"}}},
                    "amount": {"type": "text", "fields": {"keyword": {"type": "keyword"}}},
                    "price": {"type": "text", "fields": {"keyword": {"type": "keyword"}}},
                    "event_type": {"type": "text", "fields": {"keyword": {"type": "keyword"}}},
                }
            }
        },
        "sell-logs": {
            "mappings": {
                "properties": {
                    "@timestamp": {"type": "date"},
                    "coin_name": {"type": "text", "fields": {"keyword": {"type": "keyword"}}},
                    "amount": {"type": "text", "fields": {"keyword": {"type": "keyword"}}},
                    "price": {"type": "text", "fields": {"keyword": {"type": "keyword"}}},
                    "event_type": {"type": "text", "fields": {"keyword": {"type": "keyword"}}},
                }
            }
        },
        "krw-logs": {
            "mappings": {
                "properties": {
                    "@timestamp": {"type": "date"},
                    "action": {"type": "text", "fields": {"keyword": {"type": "keyword"}}},
                    "amount": {"type": "text", "fields": {"keyword": {"type": "keyword"}}},
                    "email": {"type": "text", "fields": {"keyword": {"type": "keyword"}}},
                    "port": {"type": "integer"},
                    "event_type": {"type": "text", "fields": {"keyword": {"type": "keyword"}}},
                    "host": {"type": "text", "fields": {"keyword": {"type": "keyword"}}},
                    "tags": {"type": "text", "fields": {"keyword": {"type": "keyword"}}},
                    "thread_name": {"type": "text", "fields": {"keyword": {"type": "keyword"}}},
                    "level": {"type": "text", "fields": {"keyword": {"type": "keyword"}}},
                    "logger_name": {"type": "text", "fields": {"keyword": {"type": "keyword"}}},
                    "message": {"type": "text", "fields": {"keyword": {"type": "keyword"}}}
                }
            }
        }
    }

    for index_name, body in indices_to_create.items():
        if not es.indices.exists(index=index_name):
            es.indices.create(index=index_name, body=body)
            print(f"[INFO] Created index: {index_name}")
        else:
            print(f"[INFO] Index already exists: {index_name}")


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
    res = es.search(index="login-logs,register-logs,trade-logs,logout-logs,buy-logs,sell-logs, krw-logs", body=body)
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

# 매수거래대금 가져오기
def fetch_buy_logs_aggregation(index: str = "buy-logs", size: int = 0):
    body = {
                "size": 0,
                "query": {
                    "term": {
                        "event_type": "buy"
                    }
                },
                "runtime_mappings": {
                    "trade_value": {
                        "type": "double",
                        "script": {
                            "source": """
                                if (params._source.containsKey('amount') && params._source.amount != null 
                                    && params._source.containsKey('price') && params._source.price != null) {
                                    try {
                                        double amt = Double.parseDouble(params._source.amount.toString());
                                        double prc = Double.parseDouble(params._source.price.toString());
                                        emit(amt * prc);
                                    } catch (Exception e) {
                                        // 변환 실패시 skip
                                    }
                                }
                            """
                        }
                    }
                },
                "aggs": {
                    "coins": {
                        "terms": {
                            "field": "coin_name.keyword",
                            "size": 10
                        },
                        "aggs": {
                            "total_trade_value": {
                                "sum": {
                                    "field": "trade_value"
                                }
                            }
                        }
                    }
                }
            }

    res = es.search(index=index, body=body)
    buckets = res.get("aggregations", {}).get("coins", {}).get("buckets", [])
    
    result = []
    for bucket in buckets:
        coin = bucket.get("key")
        total_trade_value = bucket.get("total_trade_value", {}).get("value", 0)
        result.append({
            "coin": coin,
            "total_amount": total_trade_value
        })
    return result

# 입출금내역 로그 가져오기
def get_user_krw(user_id: int):
    # print(es.search(index="krw-logs", body={"query": {"match_all": {}}}, size=5))
    query = {
        "query": {
            "bool": {
                "must": [
                    {"term": {"event_type": "krw"}},
                    {"term": {"user_id": user_id}}
                ]
            }
        },
        "sort": [{"@timestamp": {"order": "desc"}}],
        "size": 20
    }
    try:
        res = es.search(index="krw-logs", body=query)
        hits = res["hits"]["hits"]
    except Exception as e:
        print("입출금 오류:", e)
    return [
        {
            "action": h["_source"].get("action"),
            "amount": h["_source"].get("amount"),
            "timestamp": h["_source"].get("@timestamp"),
        }
        for h in hits
    ]