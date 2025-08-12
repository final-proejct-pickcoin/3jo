package com.finalproject.pickcoin.repository;

import java.util.List;
import com.finalproject.pickcoin.domain.Asset;
import org.apache.ibatis.annotations.Mapper;
import org.springframework.beans.factory.annotation.Autowired;

@Mapper
public interface AssetRepository {
        @Autowired
        List<Asset> get_asset_list();

}
