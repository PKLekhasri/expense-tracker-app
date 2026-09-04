package com.example.expensetracker.service;

import com.example.expensetracker.entity.*;
import com.example.expensetracker.repository.BillRepository;
import com.example.expensetracker.repository.LoanRepository;
import com.example.expensetracker.repository.NotificationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
public class ReminderService {

    @Autowired
    private BillRepository billRepository;

    @Autowired
    private LoanRepository loanRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private AuthService authService;

    @Transactional
    public void generateUserReminders() {
        User currentUser = authService.getCurrentAuthenticatedUser();
        checkBillsForUser(currentUser);
        checkLoansForUser(currentUser);
    }

    @Scheduled(cron = "0 0 8 * * ?") // Daily at 8:00 AM
    @Transactional
    public void runDailyReminderCheckForAllUsers() {
        List<Bill> unpaidBills = billRepository.findByIsPaidFalse();
        for (Bill bill : unpaidBills) {
            processBillReminder(bill);
        }

        List<Loan> activeLoans = loanRepository.findByStatusNot(LoanStatus.FULLY_PAID);
        for (Loan loan : activeLoans) {
            processLoanReminder(loan);
        }
    }

    private void checkBillsForUser(User user) {
        List<Bill> bills = billRepository.findByUserIdAndIsPaidFalse(user.getId());
        for (Bill bill : bills) {
            processBillReminder(bill);
        }
    }

    private void checkLoansForUser(User user) {
        List<Loan> loans = loanRepository.findByUserIdOrderByDueDateAsc(user.getId());
        for (Loan loan : loans) {
            if (loan.getStatus() != LoanStatus.FULLY_PAID && loan.getDueDate() != null) {
                processLoanReminder(loan);
            }
        }
    }

    private void processBillReminder(Bill bill) {
        LocalDate today = LocalDate.now();
        long daysRemaining = ChronoUnit.DAYS.between(today, bill.getDueDate());

        if (daysRemaining <= bill.getReminderDays()) {
            String title;
            String message;
            NotificationPriority priority;

            if (daysRemaining < 0) {
                title = "🔴 Bill Overdue";
                message = "Rent bill / " + bill.getBillName() + " (₹" + bill.getAmount() + ") is overdue by " + Math.abs(daysRemaining) + " days!";
                priority = NotificationPriority.OVERDUE;
            } else if (daysRemaining == 0) {
                title = "🔔 Bill Due Today";
                message = bill.getBillName() + " bill (₹" + bill.getAmount() + ") is due today!";
                priority = NotificationPriority.DUE_TODAY;
            } else if (daysRemaining == 1) {
                title = "🔔 Bill Due Tomorrow";
                message = bill.getBillName() + " bill (₹" + bill.getAmount() + ") is due tomorrow.";
                priority = NotificationPriority.WARNING;
            } else {
                title = "🔔 Bill Due Soon";
                message = bill.getBillName() + " bill (₹" + bill.getAmount() + ") due in " + daysRemaining + " days.";
                priority = NotificationPriority.INFO;
            }

            // Avoid duplicate active notifications for the same state
            Boolean exists = notificationRepository.existsByUserIdAndTypeAndReferenceIdAndTitle(
                    bill.getUser().getId(), NotificationType.BILL, bill.getId(), title);

            if (!exists) {
                Notification notification = new Notification(
                        bill.getUser(),
                        title,
                        message,
                        NotificationType.BILL,
                        bill.getId(),
                        priority
                );
                notificationRepository.save(notification);
            }
        }
    }

    private void processLoanReminder(Loan loan) {
        if (loan.getDueDate() == null) return;

        LocalDate today = LocalDate.now();
        long daysRemaining = ChronoUnit.DAYS.between(today, loan.getDueDate());

        if (daysRemaining <= loan.getReminderDays()) {
            String title;
            String message;
            NotificationPriority priority;

            String party = loan.getPersonName();
            String verb = loan.getType() == LoanType.BORROWED ? "borrowed from " + party : "lent to " + party;

            if (daysRemaining < 0) {
                title = "🔴 Loan Overdue";
                message = "₹" + loan.getRemainingAmount() + " " + verb + " is overdue!";
                priority = NotificationPriority.OVERDUE;
            } else if (daysRemaining == 0) {
                title = "🔔 Loan Due Today";
                message = "Loan of ₹" + loan.getRemainingAmount() + " (" + verb + ") is due today!";
                priority = NotificationPriority.DUE_TODAY;
            } else if (daysRemaining == 1) {
                title = "🔔 Loan Due Tomorrow";
                message = "Loan to " + party + " (₹" + loan.getRemainingAmount() + ") is due tomorrow.";
                priority = NotificationPriority.WARNING;
            } else {
                title = "🔔 Loan Due Soon";
                message = "Loan to " + party + " (₹" + loan.getRemainingAmount() + ") due in " + daysRemaining + " days.";
                priority = NotificationPriority.INFO;
            }

            Boolean exists = notificationRepository.existsByUserIdAndTypeAndReferenceIdAndTitle(
                    loan.getUser().getId(), NotificationType.LOAN, loan.getId(), title);

            if (!exists) {
                Notification notification = new Notification(
                        loan.getUser(),
                        title,
                        message,
                        NotificationType.LOAN,
                        loan.getId(),
                        priority
                );
                notificationRepository.save(notification);
            }
        }
    }
}
