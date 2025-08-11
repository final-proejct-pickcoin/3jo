package com.finalproject.pickcoin.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.finalproject.pickcoin.domain.Asset;
import com.finalproject.pickcoin.service.MarketService;
import org.springframework.web.bind.annotation.GetMapping;
import java.util.List;


@RestController
@RequestMapping("/api/assets")
public class MarketController {

    @Autowired
    private MarketService marketService;

    @GetMapping("path")
    public List<Asset> getAssets() {
        return marketService.get_coin_list();
    }
    
    
}
