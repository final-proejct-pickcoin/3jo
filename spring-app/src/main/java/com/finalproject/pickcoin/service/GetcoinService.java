package com.finalproject.pickcoin.service;

import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import java.util.List;
import com.finalproject.pickcoin.domain.*;
import java.util.Arrays;

@Service
public class GetcoinService {
    //http로 요청 전달
    private final RestTemplate restTemplate = new RestTemplate();


    public List<Asset> get_Assets(){
    String url = "https://api.upbit.com/v1/market/all?isDetails=false";
    //json list 받을건데 이를 자바 객체 배열로 바꿔 받아야해서 Asset[]
    Asset[] response = restTemplate.getForObject(url,Asset[].class);
    return Arrays.asList(response);
    }
    
}
