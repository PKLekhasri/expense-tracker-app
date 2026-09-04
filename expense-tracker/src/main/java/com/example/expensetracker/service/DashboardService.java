package com.example.expensetracker.service;

import com.example.expensetracker.dto.CategorySummaryDto;
import com.example.expensetracker.dto.DashboardSummaryDto;
import com.example.expensetracker.dto.TrendSummaryDto;
import com.example.expensetracker.entity.MonthlyIncome;
import com.example.expensetracker.entity.TransactionType;
import com.example.expensetracker.entity.User;
import com.example.expensetracker.repository.MonthlyIncomeRepository;
import com.example.expensetracker.repository.TransactionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.Month;
import java.time.YearMonth;
import java.time.format.TextStyle;
import java.util.*;

@Service
public class DashboardService {

    @Autowired
    private TransactionRepository transactionRepository;

    @Autowired
    private MonthlyIncomeRepository monthlyIncomeRepository;

    @Autowired
    private AuthService authService;

    public DashboardSummaryDto getDashboardSummary(String period, LocalDate customStartDate, LocalDate customEndDate) {
        User currentUser = authService.getCurrentAuthenticatedUser();
        LocalDate[] dates = resolvePeriodDates(period, customStartDate, customEndDate);
        LocalDate startDate = dates[0];
        LocalDate endDate = dates[1];

        // 1. Calculate Monthly Income for the period
        BigDecimal fixedMonthlyIncome = BigDecimal.ZERO;
        YearMonth currentYM = YearMonth.from(startDate);
        YearMonth endYM = YearMonth.from(endDate);

        while (!currentYM.isAfter(endYM)) {
            Optional<MonthlyIncome> inc = monthlyIncomeRepository.findByUserAndMonthAndYear(
                    currentUser, currentYM.getMonthValue(), currentYM.getYear());
            if (inc.isPresent()) {
                fixedMonthlyIncome = fixedMonthlyIncome.add(inc.get().getAmount());
            }
            currentYM = currentYM.plusMonths(1);
        }

        // 2. Transaction additional Income
        BigDecimal txIncome = transactionRepository.sumAmountByUserIdAndTypeAndDateBetween(
                currentUser.getId(), TransactionType.INCOME, startDate, endDate);
        if (txIncome == null) txIncome = BigDecimal.ZERO;

        BigDecimal totalIncome = fixedMonthlyIncome.add(txIncome);

        // 3. Transaction Expenses
        BigDecimal totalExpenses = transactionRepository.sumAmountByUserIdAndTypeAndDateBetween(
                currentUser.getId(), TransactionType.EXPENSE, startDate, endDate);
        if (totalExpenses == null) totalExpenses = BigDecimal.ZERO;

        // 4. Current Balance = Total Income - Total Expenses
        BigDecimal currentBalance = totalIncome.subtract(totalExpenses);

        // 5. Savings = Income - Expenses
        BigDecimal savings = currentBalance;
        Double savingsPercentage = 0.0;
        if (totalIncome.compareTo(BigDecimal.ZERO) > 0) {
            savingsPercentage = savings.multiply(new BigDecimal(100))
                    .divide(totalIncome, 2, RoundingMode.HALF_UP).doubleValue();
        }

        String periodName = getPeriodDisplayName(period, startDate, endDate);

        return new DashboardSummaryDto(totalIncome, totalExpenses, currentBalance, savings, savingsPercentage, periodName);
    }

    public List<CategorySummaryDto> getCategorySummary(String period, LocalDate customStartDate, LocalDate customEndDate) {
        User currentUser = authService.getCurrentAuthenticatedUser();
        LocalDate[] dates = resolvePeriodDates(period, customStartDate, customEndDate);
        List<Object[]> results = transactionRepository.sumExpensesByCategoryAndDateBetween(
                currentUser.getId(), dates[0], dates[1]);

        BigDecimal total = BigDecimal.ZERO;
        for (Object[] row : results) {
            total = total.add((BigDecimal) row[1]);
        }

        List<CategorySummaryDto> list = new ArrayList<>();
        for (Object[] row : results) {
            String cat = (String) row[0];
            BigDecimal amt = (BigDecimal) row[1];
            Double pct = 0.0;
            if (total.compareTo(BigDecimal.ZERO) > 0) {
                pct = amt.multiply(new BigDecimal(100)).divide(total, 2, RoundingMode.HALF_UP).doubleValue();
            }
            list.add(new CategorySummaryDto(cat, amt, pct));
        }

        return list;
    }

    public List<TrendSummaryDto> getTrendData(Integer year) {
        User currentUser = authService.getCurrentAuthenticatedUser();
        int targetYear = year != null ? year : LocalDate.now().getYear();
        List<TrendSummaryDto> trend = new ArrayList<>();

        for (int m = 1; m <= 12; m++) {
            YearMonth ym = YearMonth.of(targetYear, m);
            LocalDate start = ym.atDay(1);
            LocalDate end = ym.atEndOfMonth();

            BigDecimal incFixed = monthlyIncomeRepository.findByUserAndMonthAndYear(currentUser, m, targetYear)
                    .map(MonthlyIncome::getAmount).orElse(BigDecimal.ZERO);

            BigDecimal incTx = transactionRepository.sumAmountByUserIdAndTypeAndDateBetween(
                    currentUser.getId(), TransactionType.INCOME, start, end);
            if (incTx == null) incTx = BigDecimal.ZERO;

            BigDecimal expTx = transactionRepository.sumAmountByUserIdAndTypeAndDateBetween(
                    currentUser.getId(), TransactionType.EXPENSE, start, end);
            if (expTx == null) expTx = BigDecimal.ZERO;

            String monthName = Month.of(m).getDisplayName(TextStyle.SHORT, Locale.ENGLISH);
            trend.add(new TrendSummaryDto(monthName, incFixed.add(incTx), expTx));
        }

        return trend;
    }

    private LocalDate[] resolvePeriodDates(String period, LocalDate customStartDate, LocalDate customEndDate) {
        LocalDate today = LocalDate.now();
        LocalDate startDate;
        LocalDate endDate;

        if ("previous_month".equalsIgnoreCase(period)) {
            YearMonth prevYM = YearMonth.from(today).minusMonths(1);
            startDate = prevYM.atDay(1);
            endDate = prevYM.atEndOfMonth();
        } else if ("current_year".equalsIgnoreCase(period)) {
            startDate = LocalDate.of(today.getYear(), 1, 1);
            endDate = LocalDate.of(today.getYear(), 12, 31);
        } else if ("custom".equalsIgnoreCase(period) && customStartDate != null && customEndDate != null) {
            startDate = customStartDate;
            endDate = customEndDate;
        } else {
            // Default: current_month
            YearMonth currentYM = YearMonth.from(today);
            startDate = currentYM.atDay(1);
            endDate = currentYM.atEndOfMonth();
        }

        return new LocalDate[]{startDate, endDate};
    }

    private String getPeriodDisplayName(String period, LocalDate start, LocalDate end) {
        if ("previous_month".equalsIgnoreCase(period)) {
            return start.getMonth().getDisplayName(TextStyle.FULL, Locale.ENGLISH) + " " + start.getYear();
        } else if ("current_year".equalsIgnoreCase(period)) {
            return "Year " + start.getYear();
        } else if ("custom".equalsIgnoreCase(period)) {
            return start + " to " + end;
        }
        return start.getMonth().getDisplayName(TextStyle.FULL, Locale.ENGLISH) + " " + start.getYear();
    }
}
