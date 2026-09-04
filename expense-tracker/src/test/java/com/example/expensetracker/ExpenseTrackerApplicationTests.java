package com.example.expensetracker;

import com.example.expensetracker.dto.*;
import com.example.expensetracker.entity.*;
import com.example.expensetracker.exception.BadRequestException;
import com.example.expensetracker.repository.*;
import com.example.expensetracker.service.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@Transactional
public class ExpenseTrackerApplicationTests {

    @Autowired
    private AuthService authService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private IncomeService incomeService;

    @Autowired
    private MonthlyIncomeRepository monthlyIncomeRepository;

    @Autowired
    private TransactionService transactionService;

    @Autowired
    private DashboardService dashboardService;

    @Autowired
    private SavingsGoalService savingsGoalService;

    @Autowired
    private LoanService loanService;

    @Autowired
    private BillService billService;

    @Autowired
    private ReminderService reminderService;

    @Autowired
    private NotificationRepository notificationRepository;

    private User testUser;

    @BeforeEach
    public void setUp() {
        notificationRepository.deleteAll();
        userRepository.deleteAll();

        RegisterRequest request = new RegisterRequest("lekhatest", "password123", "password123");
        testUser = authService.registerUser(request);

        // Authenticate context for tests
        com.example.expensetracker.security.UserPrincipal principal = 
                com.example.expensetracker.security.UserPrincipal.create(testUser);
        UsernamePasswordAuthenticationToken auth = 
                new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities());
        SecurityContextHolder.getContext().setAuthentication(auth);
    }

    @Test
    @DisplayName("Test User Registration & BCrypt Hashing")
    public void testUserRegistration() {
        assertNotNull(testUser.getId());
        assertEquals("lekhatest", testUser.getUsername());
        assertNotEquals("password123", testUser.getPasswordHash());
        assertTrue(testUser.getPasswordHash().startsWith("$2a$"));
    }

    @Test
    @DisplayName("Test Duplicate Username Rejection")
    public void testDuplicateUsernameRejection() {
        RegisterRequest dupRequest = new RegisterRequest("lekhatest", "pass456", "pass456");
        assertThrows(BadRequestException.class, () -> authService.registerUser(dupRequest));
    }

    @Test
    @DisplayName("Test Login Success")
    public void testLogin() {
        AuthRequest authReq = new AuthRequest("lekhatest", "password123");
        AuthResponse response = authService.loginUser(authReq);
        assertNotNull(response.getToken());
        assertEquals("lekhatest", response.getUsername());
    }

    @Test
    @DisplayName("Test Monthly Income Upsert & Uniqueness")
    public void testMonthlyIncomeUniquenessAndUpdate() {
        IncomeRequest request1 = new IncomeRequest(9, 2026, new BigDecimal("50000.00"));
        incomeService.saveOrUpdateIncome(request1);

        Optional<MonthlyIncome> inc1 = monthlyIncomeRepository.findByUserAndMonthAndYear(testUser, 9, 2026);
        assertTrue(inc1.isPresent());
        assertEquals(new BigDecimal("50000.00"), inc1.get().getAmount());

        // Re-enter for same month -> must update existing record
        IncomeRequest request2 = new IncomeRequest(9, 2026, new BigDecimal("55000.00"));
        incomeService.saveOrUpdateIncome(request2);

        List<MonthlyIncome> allIncomes = monthlyIncomeRepository.findByUserId(testUser.getId());
        assertEquals(1, allIncomes.size());
        assertEquals(new BigDecimal("55000.00"), allIncomes.get(0).getAmount());
    }

    @Test
    @DisplayName("Test Transaction Creation & Dashboard Calculation")
    public void testTransactionAndDashboard() {
        // Income
        IncomeRequest incReq = new IncomeRequest(9, 2026, new BigDecimal("50000.00"));
        incomeService.saveOrUpdateIncome(incReq);

        // Transactions
        TransactionDto tx1 = new TransactionDto(null, new BigDecimal("300.00"), "Food", LocalDate.of(2026, 9, 2), "Lunch", TransactionType.EXPENSE);
        transactionService.createTransaction(tx1);

        TransactionDto tx2 = new TransactionDto(null, new BigDecimal("1200.00"), "Shopping", LocalDate.of(2026, 9, 3), "Clothes", TransactionType.EXPENSE);
        transactionService.createTransaction(tx2);

        DashboardSummaryDto summary = dashboardService.getDashboardSummary("custom", LocalDate.of(2026, 9, 1), LocalDate.of(2026, 9, 30));
        assertEquals(new BigDecimal("50000.00"), summary.getTotalIncome());
        assertEquals(new BigDecimal("1500.00"), summary.getTotalExpenses());
        assertEquals(new BigDecimal("48500.00"), summary.getCurrentBalance());
        assertEquals(new BigDecimal("48500.00"), summary.getSavings());
    }

    @Test
    @DisplayName("Test Loan Creation and Partial/Full Repayments")
    public void testLoanRepayments() {
        LoanDto loanDto = new LoanDto();
        loanDto.setPersonName("Ravi");
        loanDto.setType(LoanType.BORROWED);
        loanDto.setAmount(new BigDecimal("5000.00"));
        loanDto.setDateGivenTaken(LocalDate.now());
        loanDto.setDueDate(LocalDate.now().plusDays(5));
        loanDto.setReminderDays(3);

        LoanDto created = loanService.createLoan(loanDto);
        assertEquals(LoanStatus.PENDING, created.getStatus());
        assertEquals(new BigDecimal("5000.00"), created.getRemainingAmount());

        // Partial repayment
        LoanRepaymentDto rep1 = new LoanRepaymentDto(new BigDecimal("2000.00"), LocalDate.now(), "Part payment");
        LoanDto afterPart = loanService.addRepayment(created.getId(), rep1);
        assertEquals(LoanStatus.PARTIALLY_PAID, afterPart.getStatus());
        assertEquals(new BigDecimal("3000.00"), afterPart.getRemainingAmount());

        // Invalid repayment (> remaining balance)
        LoanRepaymentDto repInvalid = new LoanRepaymentDto(new BigDecimal("4000.00"), LocalDate.now(), "Over payment");
        assertThrows(BadRequestException.class, () -> loanService.addRepayment(created.getId(), repInvalid));

        // Full repayment
        LoanRepaymentDto rep2 = new LoanRepaymentDto(new BigDecimal("3000.00"), LocalDate.now(), "Final payment");
        LoanDto afterFull = loanService.addRepayment(created.getId(), rep2);
        assertEquals(LoanStatus.FULLY_PAID, afterFull.getStatus());
        assertEquals(new BigDecimal("0.00"), afterFull.getRemainingAmount());
    }

    @Test
    @DisplayName("Test Unified Reminder Engine for Bills and Loans")
    public void testReminderEngine() {
        // Create upcoming bill due in 2 days
        BillDto billDto = new BillDto();
        billDto.setBillName("Electricity");
        billDto.setAmount(new BigDecimal("1500.00"));
        billDto.setCategory("Bills");
        billDto.setDueDate(LocalDate.now().plusDays(2));
        billDto.setRecurringFrequency(RecurringFrequency.MONTHLY);
        billDto.setReminderDays(3);
        billService.createBill(billDto);

        // Run reminder engine
        reminderService.generateUserReminders();

        List<Notification> notifications = notificationRepository.findByUserIdOrderByCreatedAtDesc(testUser.getId());
        assertFalse(notifications.isEmpty());
        assertTrue(notifications.stream().anyMatch(n -> n.getTitle().contains("Bill Due")));
    }
}
