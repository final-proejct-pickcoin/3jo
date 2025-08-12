package com.finalproject.pickcoin.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.finalproject.pickcoin.domain.Asset;
import com.finalproject.pickcoin.service.AssetService;


@RestController
@RequestMapping("/api/assets")
@CrossOrigin(origins = "*")
public class AssetController {

    @Autowired
    private AssetService assetService;

    @GetMapping
    public List<Asset> get_asset_list() {
        return assetService.get_asset_list();
    }
    
    
}
