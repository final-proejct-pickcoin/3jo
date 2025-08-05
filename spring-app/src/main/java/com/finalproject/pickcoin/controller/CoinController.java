package com.finalproject.pickcoin.controller;

import com.finalproject.pickcoin.entity.Coin;
import com.finalproject.pickcoin.repository.CoinRepository;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@RequestMapping("/api/coins")
public class CoinController {
    private final CoinRepository coinRepository;

    public CoinController(CoinRepository coinRepository) {
        this.coinRepository = coinRepository;
    }

    @GetMapping("/list")
    public List<Coin> getCoinList() {
        return coinRepository.findAll();
    }
}
