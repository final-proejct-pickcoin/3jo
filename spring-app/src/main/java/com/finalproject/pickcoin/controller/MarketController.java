package com.finalproject.pickcoin.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.finalproject.pickcoin.domain.Market_item;
import com.finalproject.pickcoin.service.MarketService;


@RestController
@RequestMapping("/api/Market_assets")
@CrossOrigin(origins = "*")
public class MarketController {

    @Autowired
    private MarketService marketService;

    @GetMapping("/bookmarks")
    public List<Integer> get_bookmarked_assets(@RequestParam("user_id") int user_id) {
        return marketService.find_bookmarked_asset(user_id);
    }

    @GetMapping("/assets_and_bookmarks")
    public List<Market_item> get_assets_and_bookmarks(@RequestParam("user_id") Long user_id) {
        return marketService.find_asset_and_bookmark(user_id);
    }

    @PostMapping("/bookmarks")
    public void add_bookmark(@RequestParam("user_id") int user_id,
                            @RequestParam("asset_id") int asset_id) {
        marketService.insert_bookmark(user_id, asset_id);
    }

    @DeleteMapping("/bookmarks")
    public void remove_bookmark(@RequestParam("user_id") int user_id,
                                @RequestParam("asset_id") int asset_id) {
        marketService.delete_bookmark(user_id, asset_id);
    }
    
    
    @GetMapping("/asset-id")
    public List<Market_item> get_assets_id(@RequestParam("asset_symbol") String asset_symbol) {
        return marketService.get_assets_id(asset_symbol);
    }
}
