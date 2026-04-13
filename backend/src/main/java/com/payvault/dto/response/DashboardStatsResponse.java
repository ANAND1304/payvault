package com.payvault.dto.response;

import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;

@Data @Builder
public class DashboardStatsResponse {
    private long totalOrders;
    private long successfulTransactions;
    private long failedTransactions;
    private long pendingTransactions;
    private BigDecimal totalRevenue;
    private BigDecimal revenueThisMonth;
    private long ordersToday;
    private double successRate;
}
