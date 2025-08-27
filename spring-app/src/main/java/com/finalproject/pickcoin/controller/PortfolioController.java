package com.finalproject.pickcoin.controller;

import java.util.List;
import java.util.Map;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.finalproject.pickcoin.domain.PortfolioSummary;
import com.finalproject.pickcoin.service.PortfolioService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/portfolio")
@CrossOrigin(origins="*")
@RequiredArgsConstructor
public class PortfolioController {
    private final PortfolioService service;

    @GetMapping("/summary")
    public PortfolioSummary summary(@RequestParam("user_id") long userId){
        return service.getSummary(userId);
    }

    @GetMapping("/holdings")
    public List<Map<String,Object>> holdings(@RequestParam("user_id") long userId){
        return service.getHoldings(userId);
    }

    @GetMapping("/trades")
    public List<Map<String,Object>> trades(
                                        @RequestParam("user_id") long userId,
                                        @RequestParam(value="asset_id", required=false) Long assetId,
                                        @RequestParam(value="limit",  defaultValue="50") int limit,
                                        @RequestParam(value="offset", defaultValue="0")  int offset
    ){
        return service.getTrades(userId, assetId, limit, offset);
    }
}
