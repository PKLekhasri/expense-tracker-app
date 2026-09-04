package com.example.expensetracker.service;

import com.example.expensetracker.dto.TransactionDto;
import com.example.expensetracker.entity.Transaction;
import com.example.expensetracker.entity.User;
import com.example.expensetracker.exception.ResourceNotFoundException;
import com.example.expensetracker.repository.TransactionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class TransactionService {

    @Autowired
    private TransactionRepository transactionRepository;

    @Autowired
    private AuthService authService;

    public List<TransactionDto> getAllTransactions() {
        User currentUser = authService.getCurrentAuthenticatedUser();
        return transactionRepository.findByUserIdOrderByDateDescCreatedAtDesc(currentUser.getId())
                .stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    public List<TransactionDto> getTransactionsForDate(LocalDate date) {
        User currentUser = authService.getCurrentAuthenticatedUser();
        return transactionRepository.findByUserIdAndDate(currentUser.getId(), date)
                .stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    public List<TransactionDto> getTransactionsBetween(LocalDate startDate, LocalDate endDate) {
        User currentUser = authService.getCurrentAuthenticatedUser();
        return transactionRepository.findByUserIdAndDateBetweenOrderByDateDesc(currentUser.getId(), startDate, endDate)
                .stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    public TransactionDto getTransactionById(Long id) {
        User currentUser = authService.getCurrentAuthenticatedUser();
        Transaction transaction = transactionRepository.findByIdAndUserId(id, currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Transaction not found with id: " + id));
        return convertToDto(transaction);
    }

    @Transactional
    public TransactionDto createTransaction(TransactionDto dto) {
        User currentUser = authService.getCurrentAuthenticatedUser();
        Transaction transaction = new Transaction(
                currentUser,
                dto.getAmount(),
                dto.getCategory(),
                dto.getDate(),
                dto.getDescription(),
                dto.getType()
        );
        Transaction saved = transactionRepository.save(transaction);
        return convertToDto(saved);
    }

    @Transactional
    public TransactionDto updateTransaction(Long id, TransactionDto dto) {
        User currentUser = authService.getCurrentAuthenticatedUser();
        Transaction transaction = transactionRepository.findByIdAndUserId(id, currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Transaction not found with id: " + id));

        transaction.setAmount(dto.getAmount());
        transaction.setCategory(dto.getCategory());
        transaction.setDate(dto.getDate());
        transaction.setDescription(dto.getDescription());
        transaction.setType(dto.getType());

        Transaction updated = transactionRepository.save(transaction);
        return convertToDto(updated);
    }

    @Transactional
    public void deleteTransaction(Long id) {
        User currentUser = authService.getCurrentAuthenticatedUser();
        Transaction transaction = transactionRepository.findByIdAndUserId(id, currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Transaction not found with id: " + id));
        transactionRepository.delete(transaction);
    }

    public TransactionDto convertToDto(Transaction t) {
        return new TransactionDto(
                t.getId(),
                t.getAmount(),
                t.getCategory(),
                t.getDate(),
                t.getDescription(),
                t.getType()
        );
    }
}
