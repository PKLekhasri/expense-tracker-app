package com.example.expensetracker.service;

import com.example.expensetracker.dto.DashboardSummaryDto;
import com.example.expensetracker.dto.SavingsGoalDto;
import com.example.expensetracker.entity.SavingsGoal;
import com.example.expensetracker.entity.User;
import com.example.expensetracker.exception.ResourceNotFoundException;
import com.example.expensetracker.repository.SavingsGoalRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class SavingsGoalService {

    @Autowired
    private SavingsGoalRepository savingsGoalRepository;

    @Autowired
    private DashboardService dashboardService;

    @Autowired
    private AuthService authService;

    public List<SavingsGoalDto> getAllSavingsGoals() {
        User currentUser = authService.getCurrentAuthenticatedUser();
        // Calculate current user overall savings for standard calculation
        DashboardSummaryDto summary = dashboardService.getDashboardSummary("current_year", null, null);
        BigDecimal currentTotalSavings = summary.getSavings();

        return savingsGoalRepository.findByUserIdOrderByTargetDateAsc(currentUser.getId())
                .stream()
                .map(goal -> convertToDto(goal, currentTotalSavings))
                .collect(Collectors.toList());
    }

    @Transactional
    public SavingsGoalDto createSavingsGoal(SavingsGoalDto dto) {
        User currentUser = authService.getCurrentAuthenticatedUser();
        SavingsGoal goal = new SavingsGoal(
                currentUser,
                dto.getGoalName(),
                dto.getTargetAmount(),
                dto.getTargetDate(),
                dto.getDescription()
        );
        SavingsGoal saved = savingsGoalRepository.save(goal);
        DashboardSummaryDto summary = dashboardService.getDashboardSummary("current_year", null, null);
        return convertToDto(saved, summary.getSavings());
    }

    @Transactional
    public SavingsGoalDto updateSavingsGoal(Long id, SavingsGoalDto dto) {
        User currentUser = authService.getCurrentAuthenticatedUser();
        SavingsGoal goal = savingsGoalRepository.findByIdAndUserId(id, currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Savings goal not found with id: " + id));

        goal.setGoalName(dto.getGoalName());
        goal.setTargetAmount(dto.getTargetAmount());
        goal.setTargetDate(dto.getTargetDate());
        goal.setDescription(dto.getDescription());

        SavingsGoal updated = savingsGoalRepository.save(goal);
        DashboardSummaryDto summary = dashboardService.getDashboardSummary("current_year", null, null);
        return convertToDto(updated, summary.getSavings());
    }

    @Transactional
    public void deleteSavingsGoal(Long id) {
        User currentUser = authService.getCurrentAuthenticatedUser();
        SavingsGoal goal = savingsGoalRepository.findByIdAndUserId(id, currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Savings goal not found with id: " + id));
        savingsGoalRepository.delete(goal);
    }

    private SavingsGoalDto convertToDto(SavingsGoal goal, BigDecimal userCurrentSavings) {
        SavingsGoalDto dto = new SavingsGoalDto();
        dto.setId(goal.getId());
        dto.setGoalName(goal.getGoalName());
        dto.setTargetAmount(goal.getTargetAmount());
        dto.setTargetDate(goal.getTargetDate());
        dto.setDescription(goal.getDescription());

        BigDecimal savings = userCurrentSavings != null && userCurrentSavings.compareTo(BigDecimal.ZERO) > 0 
                ? userCurrentSavings : BigDecimal.ZERO;
        dto.setCurrentSavings(savings);

        BigDecimal remaining = goal.getTargetAmount().subtract(savings);
        if (remaining.compareTo(BigDecimal.ZERO) < 0) {
            remaining = BigDecimal.ZERO;
        }
        dto.setRemainingAmount(remaining);

        Double progress = 0.0;
        if (goal.getTargetAmount().compareTo(BigDecimal.ZERO) > 0) {
            progress = savings.multiply(new BigDecimal(100))
                    .divide(goal.getTargetAmount(), 2, RoundingMode.HALF_UP).doubleValue();
            if (progress > 100.0) progress = 100.0;
        }
        dto.setProgressPercentage(progress);
        dto.setIsAchieved(savings.compareTo(goal.getTargetAmount()) >= 0);

        return dto;
    }
}
