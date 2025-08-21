package com.finalproject.pickcoin.domain;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
public class KeywordCount {
    private String keyword;
    private long count;
}
