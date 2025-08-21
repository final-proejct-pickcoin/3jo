package com.finalproject.pickcoin.repository;

import java.util.List;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import com.finalproject.pickcoin.domain.Notice;

@Mapper
public interface NoticeRepository {
    List<Notice> findAll();                   
    Notice findById(@Param("id") Integer id);       
    int insert(Notice notice);                      
    int update(Notice notice);                       
    int updateActive(@Param("id") Integer id,
                     @Param("active") boolean active); 
    int delete(@Param("id") Integer id);             
}
