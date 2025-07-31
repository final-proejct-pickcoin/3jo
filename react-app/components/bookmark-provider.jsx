"useclient"

import { Children, useState } from "react";
import { createContext, useContext, useState } from "react";


//context 생성
const bookmark_context = createContext();


//provider 컴포넌트
export const bookmark_provider=(()=>{
    const [bookmarked,setBookmarked]=useState({});

    return(
        <bookmark_context.Provider>={{bookmarked,setBookmarked}}
        {Children}
        </bookmark_context.Provider>
    )
})

export const useBookmark = () => useContext(bookmark_context);