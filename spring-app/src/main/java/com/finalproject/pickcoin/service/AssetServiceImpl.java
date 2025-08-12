package com.finalproject.pickcoin.service;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.finalproject.pickcoin.domain.Asset;
import com.finalproject.pickcoin.repository.AssetRepository;


@Service
public class AssetServiceImpl implements AssetService {

    @Autowired
    private AssetRepository assetRepository;
    
    @Override
    public List<Asset> get_asset_list(){
        return assetRepository.get_asset_list();
    }

    
}
