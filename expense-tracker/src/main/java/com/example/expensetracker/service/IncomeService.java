package com.example.expensetracker.service;

import com.example.expensetracker.dto.IncomeRequest;
import com.example.expensetracker.entity.MonthlyIncome;
import com.example.expensetracker.entity.User;
import com.example.expensetracker.repository.MonthlyIncomeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class IncomeService {

    @Autowired
    private MonthlyIncomeRepository monthlyIncomeRepository;

    @Autowired
    private AuthService authService;

    @Transactional
    public MonthlyIncome saveOrUpdateIncome(IncomeRequest request) {
        User currentUser = authService.getCurrentAuthenticatedUser();

        Optional<MonthlyIncome> existingIncome = monthlyIncomeRepository.findByUserAndMonthAndYear(
                currentUser, request.getMonth(), request.getYear());

        if (existingIncome.isPresent()) {
            MonthlyIncome income = existingIncome.get();
            income.setAmount(request.getAmount());
            return monthlyIncomeRepository.save(income);
        } else {
            MonthlyIncome income = new MonthlyIncome(currentUser, request.getMonth(), request.getYear(), request.getAmount());
            return monthlyIncomeRepository.save(income);
        }
    }

    public Optional<MonthlyIncome> getIncomeForMonthAndYear(Integer month, Integer year) {
        User currentUser = authService.getCurrentAuthenticatedUser();
        return monthlyIncomeRepository.findByUserAndMonthAndYear(currentUser, month, year);
    }

    public List<MonthlyIncome> getAllIncomesForUser() {
        User currentUser = authService.getCurrentAuthenticatedUser();
        return monthlyIncomeRepository.findByUserId(currentUser.getId());
    }
}
