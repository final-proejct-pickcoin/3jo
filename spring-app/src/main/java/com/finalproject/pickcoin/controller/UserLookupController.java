package com.finalproject.pickcoin.controller;

import java.util.HashMap;
import java.util.Map;

import org.apache.ibatis.annotations.Param;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.finalproject.pickcoin.repository.MypageRepository;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = {"http://localhost:3000"}, allowCredentials = "true")
public class UserLookupController {

    @Autowired
    private MypageRepository mypagerepository;



    @GetMapping("/user-id")
    public Map<String, Object> getUserId(@RequestParam("email") String email) {
        Map<String,Object> res = new HashMap<>();
        Integer uid = mypagerepository.getUserIdByEmail(email);
        res.put("ok", uid != null);
        if (uid != null) res.put("user_id", uid);
        else res.put("error", "NOT_FOUND");
        return res;
    }
    
}
