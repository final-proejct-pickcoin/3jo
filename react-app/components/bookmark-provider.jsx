"use client"

import { createContext, useContext, useState } from "react";


//context 생성
const BookmarkContext = createContext()


//provider 컴포넌트
export const BookmarkProvider=({children})=>{
    const coin_data={
        BTC : false,
        ETH : false,
        BNB : false,
        XRP : false,
        ADA : false,
        SOL : false,
        DOGE : false,
        MATIC : false,
        DOT : false,
        LINK : false

    }

    const [bookmarked,setBookmarked]=useState(coin_data);


    const toggle_Bookmark =(symbol)=>{
        setBookmarked((prev)=>({
            ...prev,
            [symbol]:!prev[symbol],
        }))

    }

    return(
        <BookmarkContext.Provider value={{bookmarked,toggle_Bookmark}}>
        {children}
        </BookmarkContext.Provider>
    )
}

export const useBookmark = () => useContext(BookmarkContext);