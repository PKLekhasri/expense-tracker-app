package com.example.expensetracker.service;

import com.example.expensetracker.dto.BillDto;
import com.example.expensetracker.entity.Bill;
import com.example.expensetracker.entity.User;
import com.example.expensetracker.exception.ResourceNotFoundException;
import com.example.expensetracker.repository.BillRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class BillService {

    @Autowired
    private BillRepository billRepository;

    @Autowired
    private AuthService authService;

    public List<BillDto> getAllBills() {
        User currentUser = authService.getCurrentAuthenticatedUser();
        return billRepository.findByUserIdOrderByDueDateAsc(currentUser.getId())
                .stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public BillDto createBill(BillDto dto) {
        User currentUser = authService.getCurrentAuthenticatedUser();
        Bill bill = new Bill(
                currentUser,
                dto.getBillName(),
                dto.getAmount(),
                dto.getCategory(),
                dto.getDueDate(),
                dto.getRecurringFrequency(),
                dto.getReminderDays(),
                dto.getNotes()
        );
        Bill saved = billRepository.save(bill);
        return convertToDto(saved);
    }

    @Transactional
    public BillDto updateBill(Long id, BillDto dto) {
        User currentUser = authService.getCurrentAuthenticatedUser();
        Bill bill = billRepository.findByIdAndUserId(id, currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Bill not found with id: " + id));

        bill.setBillName(dto.getBillName());
        bill.setAmount(dto.getAmount());
        bill.setCategory(dto.getCategory());
        bill.setDueDate(dto.getDueDate());
        bill.setRecurringFrequency(dto.getRecurringFrequency());
        bill.setReminderDays(dto.getReminderDays());
        bill.setNotes(dto.getNotes());
        if (dto.getIsPaid() != null) {
            bill.setIsPaid(dto.getIsPaid());
        }

        Bill updated = billRepository.save(bill);
        return convertToDto(updated);
    }

    @Transactional
    public BillDto markAsPaid(Long id) {
        User currentUser = authService.getCurrentAuthenticatedUser();
        Bill bill = billRepository.findByIdAndUserId(id, currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Bill not found with id: " + id));
        bill.setIsPaid(true);
        Bill updated = billRepository.save(bill);
        return convertToDto(updated);
    }

    @Transactional
    public void deleteBill(Long id) {
        User currentUser = authService.getCurrentAuthenticatedUser();
        Bill bill = billRepository.findByIdAndUserId(id, currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Bill not found with id: " + id));
        billRepository.delete(bill);
    }

    public BillDto convertToDto(Bill b) {
        BillDto dto = new BillDto();
        dto.setId(b.getId());
        dto.setBillName(b.getBillName());
        dto.setAmount(b.getAmount());
        dto.setCategory(b.getCategory());
        dto.setDueDate(b.getDueDate());
        dto.setRecurringFrequency(b.getRecurringFrequency());
        dto.setReminderDays(b.getReminderDays());
        dto.setNotes(b.getNotes());
        dto.setIsPaid(b.getIsPaid());

        LocalDate today = LocalDate.now();
        int days = (int) ChronoUnit.DAYS.between(today, b.getDueDate());
        dto.setDaysRemaining(days);

        if (b.getIsPaid()) {
            dto.setStatusText("Paid");
        } else if (days < 0) {
            dto.setStatusText("Overdue (" + Math.abs(days) + " days ago)");
        } else if (days == 0) {
            dto.setStatusText("Due today");
        } else if (days == 1) {
            dto.setStatusText("Due tomorrow");
        } else {
            dto.setStatusText("Due in " + days + " days");
        }

        return dto;
    }
}
