package com.example.expensetracker.service;

import com.example.expensetracker.dto.LoanDto;
import com.example.expensetracker.dto.LoanRepaymentDto;
import com.example.expensetracker.entity.*;
import com.example.expensetracker.exception.BadRequestException;
import com.example.expensetracker.exception.ResourceNotFoundException;
import com.example.expensetracker.repository.LoanRepaymentRepository;
import com.example.expensetracker.repository.LoanRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class LoanService {

    @Autowired
    private LoanRepository loanRepository;

    @Autowired
    private LoanRepaymentRepository repaymentRepository;

    @Autowired
    private AuthService authService;

    public List<LoanDto> getAllLoans() {
        User currentUser = authService.getCurrentAuthenticatedUser();
        return loanRepository.findByUserIdOrderByDueDateAsc(currentUser.getId())
                .stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    public List<LoanDto> getLoansByType(LoanType type) {
        User currentUser = authService.getCurrentAuthenticatedUser();
        return loanRepository.findByUserIdAndTypeOrderByDueDateAsc(currentUser.getId(), type)
                .stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    public Map<String, BigDecimal> getLoanTotals() {
        User currentUser = authService.getCurrentAuthenticatedUser();
        List<Loan> loans = loanRepository.findByUserIdOrderByDueDateAsc(currentUser.getId());

        BigDecimal totalReceive = BigDecimal.ZERO; // LENT
        BigDecimal totalOwe = BigDecimal.ZERO;     // BORROWED

        for (Loan l : loans) {
            if (l.getStatus() != LoanStatus.FULLY_PAID) {
                if (l.getType() == LoanType.LENT) {
                    totalReceive = totalReceive.add(l.getRemainingAmount());
                } else if (l.getType() == LoanType.BORROWED) {
                    totalOwe = totalOwe.add(l.getRemainingAmount());
                }
            }
        }

        Map<String, BigDecimal> totals = new HashMap<>();
        totals.put("totalReceive", totalReceive);
        totals.put("totalOwe", totalOwe);
        return totals;
    }

    @Transactional
    public LoanDto createLoan(LoanDto dto) {
        User currentUser = authService.getCurrentAuthenticatedUser();
        Loan loan = new Loan(
                currentUser,
                dto.getPersonName(),
                dto.getType(),
                dto.getAmount(),
                dto.getDateGivenTaken(),
                dto.getDueDate(),
                dto.getReminderDays(),
                dto.getNotes()
        );
        Loan saved = loanRepository.save(loan);
        return convertToDto(saved);
    }

    @Transactional
    public LoanDto updateLoan(Long id, LoanDto dto) {
        User currentUser = authService.getCurrentAuthenticatedUser();
        Loan loan = loanRepository.findByIdAndUserId(id, currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Loan not found with id: " + id));

        loan.setPersonName(dto.getPersonName());
        loan.setType(dto.getType());
        loan.setAmount(dto.getAmount());
        loan.setDateGivenTaken(dto.getDateGivenTaken());
        loan.setDueDate(dto.getDueDate());
        loan.setReminderDays(dto.getReminderDays());
        loan.setNotes(dto.getNotes());

        // Re-adjust remaining amount if main amount updated
        if (loan.getRepayments().isEmpty()) {
            loan.setRemainingAmount(dto.getAmount());
        }

        Loan updated = loanRepository.save(loan);
        return convertToDto(updated);
    }

    @Transactional
    public LoanDto addRepayment(Long loanId, LoanRepaymentDto repaymentDto) {
        User currentUser = authService.getCurrentAuthenticatedUser();
        Loan loan = loanRepository.findByIdAndUserId(loanId, currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Loan not found with id: " + loanId));

        BigDecimal repaymentAmount = repaymentDto.getAmount();

        if (repaymentAmount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BadRequestException("Repayment amount must be greater than 0");
        }

        if (repaymentAmount.compareTo(loan.getRemainingAmount()) > 0) {
            throw new BadRequestException("Repayment cannot exceed remaining balance of ₹" + loan.getRemainingAmount());
        }

        // Deduct repayment
        BigDecimal newRemaining = loan.getRemainingAmount().subtract(repaymentAmount);
        loan.setRemainingAmount(newRemaining);

        if (newRemaining.compareTo(BigDecimal.ZERO) == 0) {
            loan.setStatus(LoanStatus.FULLY_PAID);
        } else {
            loan.setStatus(LoanStatus.PARTIALLY_PAID);
        }

        // Save Repayment record
        LoanRepayment repayment = new LoanRepayment(
                loan,
                repaymentAmount,
                repaymentDto.getRepaymentDate() != null ? repaymentDto.getRepaymentDate() : LocalDate.now(),
                repaymentDto.getNotes()
        );

        loan.getRepayments().add(repayment);
        Loan updated = loanRepository.save(loan);

        return convertToDto(updated);
    }

    @Transactional
    public void deleteLoan(Long id) {
        User currentUser = authService.getCurrentAuthenticatedUser();
        Loan loan = loanRepository.findByIdAndUserId(id, currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Loan not found with id: " + id));
        loanRepository.delete(loan);
    }

    public LoanDto convertToDto(Loan l) {
        LoanDto dto = new LoanDto();
        dto.setId(l.getId());
        dto.setPersonName(l.getPersonName());
        dto.setType(l.getType());
        dto.setAmount(l.getAmount());
        dto.setRemainingAmount(l.getRemainingAmount());
        dto.setDateGivenTaken(l.getDateGivenTaken());
        dto.setDueDate(l.getDueDate());
        dto.setStatus(l.getStatus());
        dto.setReminderDays(l.getReminderDays());
        dto.setNotes(l.getNotes());

        if (l.getDueDate() != null) {
            LocalDate today = LocalDate.now();
            int days = (int) ChronoUnit.DAYS.between(today, l.getDueDate());
            dto.setDaysRemaining(days);

            if (l.getStatus() == LoanStatus.FULLY_PAID) {
                dto.setStatusText("Fully Paid");
            } else if (days < 0) {
                dto.setStatusText("Overdue (" + Math.abs(days) + " days ago)");
            } else if (days == 0) {
                dto.setStatusText("Due today");
            } else if (days == 1) {
                dto.setStatusText("Due tomorrow");
            } else {
                dto.setStatusText("Due in " + days + " days");
            }
        } else {
            dto.setStatusText(l.getStatus().name());
        }

        List<LoanRepaymentDto> repaymentDtos = l.getRepayments().stream()
                .map(r -> new LoanRepaymentDto(r.getAmount(), r.getRepaymentDate(), r.getNotes()))
                .collect(Collectors.toList());
        dto.setRepayments(repaymentDtos);

        return dto;
    }
}
