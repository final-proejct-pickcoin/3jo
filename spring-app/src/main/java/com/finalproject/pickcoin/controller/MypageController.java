package com.finalproject.pickcoin.controller;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.finalproject.pickcoin.domain.Market_item;
import com.finalproject.pickcoin.service.MypageService;

@RestController
@RequestMapping("/api/mypage")
@CrossOrigin(origins = "*")
public class MypageController {

    @Autowired
    private MypageService mypageService;

    // 북마크한 코인만
    @GetMapping("/bookmarks/list")
    public List<Market_item> get_only_bookmarked(@RequestParam("user_id") Long user_id) {
        return mypageService.find_bookmarked_only(user_id);
    }

    // 북마크 안 한 코인만
    @GetMapping("/assets/unbookmarked")
    public List<Market_item> get_unbookmarked(@RequestParam("user_id") Long user_id) {
        return mypageService.find_unbookmarked_only(user_id);
    }
    //토큰에서 이메일값 찾아 user_id를 가져오는 API
    @GetMapping("/user-id")
    public Map<String, Object> getUserIdByEmail(@RequestParam("email") String email) {
        Integer uid = mypageService.getUserIdByEmail(email); // null일 수 있음
        return Map.of("user_id", uid);
    }
    // public Integer getUserIdByEmail(String email){
    //     return mypageService.getUserIdByEmail(email);
    // }

    @PostMapping("/bookmarks")
    public void add_bookmark(@RequestParam("user_id") int user_id,
                            @RequestParam("asset_id") int asset_id) {
        mypageService.insert_bookmark(user_id, asset_id);
    }

    @DeleteMapping("/bookmarks")
    public void remove_bookmark(@RequestParam("user_id") int user_id,
                                @RequestParam("asset_id") int asset_id) {
        mypageService.delete_bookmark(user_id, asset_id);
    }
}

