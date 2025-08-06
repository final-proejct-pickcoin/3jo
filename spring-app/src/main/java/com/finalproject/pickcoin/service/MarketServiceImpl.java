package com.finalproject.pickcoin.service;

@Service("MarketService")
public class MarketServiceImpl implements MarketService {
    @Autowired
    private MarketRepository marketRepository;

    @Override 
    public List<Asset> get_coin_list(){
        return marketRepository.get_coin_list();
    }

    
}
