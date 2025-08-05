"use client";

import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components_admin/ui/card";
import { Input } from "@/components_admin/ui/input";
import { Button } from "@/components_admin/ui/button";
import { getTitleClass } from "@/components_admin/utils/theme-utils";

const initialFees = [
  { pair: "BTC/USDT", volume: "28,450 BTC", fee: 0.08 },
  { pair: "ETH/USDT", volume: "15,230 BTC", fee: 0.10 },
  { pair: "ADA/USDT", volume: "8,920 BTC", fee: 0.15 }
];

const RevenueManagement = ({ isDarkMode }) => {
  const [fees, setFees] = useState(initialFees);

  const [stats] = useState({
    today: 12450,
    week: 89320,
    todayChange: 15.2,
    weekChange: 8.7,
    trade: 847230,
    withdraw: 289450,
    listing: 125600
  });

  const handleFeeChange = (idx, value) => {
    setFees(fees.map((f, i) => i === idx ? { ...f, fee: value } : f));
  };

  return (
    <div className="space-y-6 min-h-screen p-6">
      <h1 className={`text-2xl font-bold mb-6 ${getTitleClass(isDarkMode)}`}>수익 관리</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 수수료 설정 */}
        <Card>
          <CardHeader>
            <CardTitle>수수료 설정</CardTitle>
            <CardDescription>거래쌍별 수수료율 관리</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {fees.map((fee, idx) => (
                <div key={fee.pair} className="flex items-center justify-between border rounded-lg px-4 py-3">
                  <div>
                    <div className="font-semibold">{fee.pair}</div>
                    <div className="text-xs text-gray-500">24시간 거래량: {fee.volume}</div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={fee.fee}
                      onChange={e => handleFeeChange(idx, parseFloat(e.target.value))}
                      className="w-20 text-right"
                    />
                    <span className="ml-1">%</span>
                  </div>
                </div>
              ))}
              <Button className="w-full mt-2">수수료율 적용</Button>
            </div>
          </CardContent>
        </Card>
        {/* 수익 현황 */}
        <Card>
          <CardHeader>
            <CardTitle>수익 현황</CardTitle>
            <CardDescription>실시간 수수료 수익 통계</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex space-x-4 mb-6">
              <div className="flex-1 bg-green-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-green-600">${stats.today.toLocaleString()}</div>
                <div className="text-xs text-gray-500 mt-1">오늘 수익</div>
                <div className="text-xs text-green-600 mt-1">+{stats.todayChange}%</div>
              </div>
              <div className="flex-1 bg-blue-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">${stats.week.toLocaleString()}</div>
                <div className="text-xs text-gray-500 mt-1">이번 주</div>
                <div className="text-xs text-blue-600 mt-1">+{stats.weekChange}%</div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>거래 수수료</span>
                <span className="text-green-600 font-bold">${stats.trade.toLocaleString()} <span className="text-xs">(67%)</span></span>
              </div>
              <div className="flex justify-between text-sm">
                <span>출금 수수료</span>
                <span className="text-blue-600 font-bold">${stats.withdraw.toLocaleString()} <span className="text-xs">(23%)</span></span>
              </div>
              <div className="flex justify-between text-sm">
                <span>상장 수수료</span>
                <span className="text-purple-600 font-bold">${stats.listing.toLocaleString()} <span className="text-xs">(10%)</span></span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RevenueManagement;
