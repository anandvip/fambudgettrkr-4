import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, updateDoc, arrayUnion, query, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBhQ5iDEdWOPPIKRgzTM1OWNhRyNdAlx2o",
    authDomain: "fambudgettrkr-3.firebaseapp.com",
    projectId: "fambudgettrkr-3",
    storageBucket: "fambudgettrkr-3.appspot.com",
    messagingSenderId: "986025650612",
    appId: "1:986025650612:web:01c418c54ec8f8c9e9eae1"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// State
let currentUser = null;
let familyMembers = [];
let categories = ['Food', 'Transportation', 'Utilities', 'Entertainment', 'Other'];
let currentMember = null;

// DOM Elements
const authContainer = document.getElementById('auth-container');
const appContainer = document.getElementById('app-container');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const signUpBtn = document.getElementById('sign-up');
const signInBtn = document.getElementById('sign-in');
const signInGoogleBtn = document.getElementById('sign-in-google');
const signOutBtn = document.getElementById('sign-out');
const familyMemberSelect = document.getElementById('family-member-select');
const newMemberNameInput = document.getElementById('new-member-name');
const submitNewMemberBtn = document.getElementById('submit-new-member');
const editMembersList = document.getElementById('edit-members-list');
const categoryList = document.getElementById('category-list');
const newCategoryInput = document.getElementById('new-category-input');
const addCategoryBtn = document.getElementById('add-category');
const totalBudgetSpan = document.getElementById('total-budget');
const remainingBalanceSpan = document.getElementById('remaining-balance');
const dailyLimitSpan = document.getElementById('daily-limit');
const budgetDurationSpan = document.getElementById('budget-duration');
const budgetInput = document.getElementById('budget-input');
const budgetTimeframeSelect = document.getElementById('budget-timeframe');
const setBudgetBtn = document.getElementById('set-budget');
const expenseAmountInput = document.getElementById('expense-amount');
const expenseCategorySelect = document.getElementById('expense-category');
const addExpenseBtn = document.getElementById('add-expense');
const expenseList = document.getElementById('expense-list');
const savingsTargetAmountInput = document.getElementById('savings-target-amount');
const savingsTargetDeadlineInput = document.getElementById('savings-target-deadline');
const setSavingsTargetBtn = document.getElementById('set-savings-target');
const savingsTargetInfo = document.getElementById('savings-target-info');
const addSavingsAmountInput = document.getElementById('add-savings-amount');
const addSavingsBtn = document.getElementById('add-savings');
const generateCategoryAnalysisBtn = document.getElementById('generate-category-analysis');
const generateSavingsReportBtn = document.getElementById('generate-savings-report');
const generateBudgetComparisonBtn = document.getElementById('generate-budget-comparison');
const reportContainer = document.getElementById('report-container');
const themeToggle = document.getElementById('theme-toggle');

// Helper Functions
function showToast(message, duration = 3000) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.getElementById('toast-container').appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 500);
    }, duration);
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);
}

// Theme Functions
function toggleTheme() {
    document.body.classList.toggle('dark-theme');
    const isDarkTheme = document.body.classList.contains('dark-theme');
    localStorage.setItem('theme', isDarkTheme);
    themeToggle.textContent = isDarkTheme ? '☀️' : '🌙';
}

function loadTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'true') {
        document.body.classList.add('dark-theme');
        themeToggle.textContent = '☀️';
    }
}

// Authentication Functions
async function signUp() {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, emailInput.value, passwordInput.value);
        showToast('Sign up successful');
        currentUser = userCredential.user;
        showAuthenticatedUI();
    } catch (error) {
        showToast('Error signing up: ' + error.message);
    }
}

async function signIn() {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, emailInput.value, passwordInput.value);
        showToast('Sign in successful');
        currentUser = userCredential.user;
        showAuthenticatedUI();
    } catch (error) {
        showToast('Error signing in: ' + error.message);
    }
}

async function signInWithGoogle() {
    const provider = new GoogleAuthProvider();
    try {
        const result = await signInWithPopup(auth, provider);
        showToast('Google sign in successful');
        currentUser = result.user;
        showAuthenticatedUI();
    } catch (error) {
        showToast('Error signing in with Google: ' + error.message);
    }
}

async function signOutUser() {
    try {
        await signOut(auth);
        showToast('Sign out successful');
        currentUser = null;
        showUnauthenticatedUI();
    } catch (error) {
        showToast('Error signing out: ' + error.message);
    }
}

function showAuthenticatedUI() {
    authContainer.classList.add('hidden');
    appContainer.classList.remove('hidden');
    signOutBtn.classList.remove('hidden');
    loadFamilyMembers();
}

function showUnauthenticatedUI() {
    authContainer.classList.remove('hidden');
    appContainer.classList.add('hidden');
    signOutBtn.classList.add('hidden');
}

// Family Member Functions
async function loadFamilyMembers() {
    try {
        const querySnapshot = await getDocs(collection(db, `users/${currentUser.uid}/familyMembers`));
        familyMembers = [];
        querySnapshot.forEach((doc) => {
            familyMembers.push(doc.data());
        });
        updateFamilyMemberSelect();
    } catch (error) {
        showToast('Error loading family members: ' + error.message);
    }
}

async function saveFamilyMembers() {
    try {
        for (const member of familyMembers) {
            await setDoc(doc(db, `users/${currentUser.uid}/familyMembers`, member.name), member);
        }
        showToast('Family members saved');
    } catch (error) {
        showToast('Error saving family members: ' + error.message);
    }
}

function updateFamilyMemberSelect() {
    familyMemberSelect.innerHTML = '<option value="">Select a family member</option>';
    familyMembers.forEach(member => {
        const option = document.createElement('option');
        option.value = member.name;
        option.textContent = member.name;
        familyMemberSelect.appendChild(option);
    });
    updateEditMembersList();
}

async function addNewFamilyMember(name) {
    if (name && !familyMembers.some(member => member.name === name.trim())) {
        const newMember = {
            name: name.trim(),
            budget: 0,
            budgetTimeframe: 30,
            expenses: [],
            savingsTarget: {
                amount: 0,
                deadline: null,
                currentSavings: 0
            }
        };
        familyMembers.push(newMember);
        await saveFamilyMembers();
        updateFamilyMemberSelect();
        showToast(`New family member added: ${name.trim()}`);
    } else {
        showToast('Please enter a valid and unique name');
    }
}

async function deleteFamilyMember(name) {
    familyMembers = familyMembers.filter(member => member.name !== name);
    await saveFamilyMembers();
    updateFamilyMemberSelect();
    showToast('Family member deleted');
}

function updateEditMembersList() {
    editMembersList.innerHTML = '';
    familyMembers.forEach(member => {
        const div = document.createElement('div');
        div.className = 'tag';
        div.textContent = member.name;
        const removeBtn = document.createElement('button');
        removeBtn.className = 'remove-tag';
        removeBtn.textContent = '×';
        removeBtn.onclick = () => deleteFamilyMember(member.name);
        div.appendChild(removeBtn);
        editMembersList.appendChild(div);
    });
}

// Category Functions
async function loadCategories() {
    try {
        const docRef = doc(db, `users/${currentUser.uid}`, 'categories');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            categories = docSnap.data().categories;
        } else {
            await setDoc(docRef, { categories: categories });
        }
        updateCategoryList();
        updateExpenseCategorySelect();
    } catch (error) {
        showToast('Error loading categories: ' + error.message);
    }
}

async function saveCategories() {
    try {
        await setDoc(doc(db, `users/${currentUser.uid}`, 'categories'), { categories: categories });
        showToast('Categories saved');
    } catch (error) {
        showToast('Error saving categories: ' + error.message);
    }
}

function updateCategoryList() {
    categoryList.innerHTML = '';
    categories.forEach(category => {
        const div = document.createElement('div');
        div.className = 'tag';
        div.textContent = category;
        const removeBtn = document.createElement('button');
        removeBtn.className = 'remove-tag';
        removeBtn.textContent = '×';
        removeBtn.onclick = () => deleteCategory(category);
        div.appendChild(removeBtn);
        categoryList.appendChild(div);
    });
}

function updateExpenseCategorySelect() {
    expenseCategorySelect.innerHTML = '<option value="">Select a category</option>';
    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        expenseCategorySelect.appendChild(option);
    });
}

async function addCategory(categoryName) {
    if (categoryName && !categories.includes(categoryName.trim())) {
        categories.push(categoryName.trim());
        await saveCategories();
        updateCategoryList();
        updateExpenseCategorySelect();
        showToast(`New category added: ${categoryName.trim()}`);
    } else {
        showToast('Please enter a valid and unique category name');
    }
}

async function deleteCategory(categoryName) {
    categories = categories.filter(category => category !== categoryName);
    await saveCategories();
    updateCategoryList();
    updateExpenseCategorySelect();
    showToast('Category deleted');
}

// Budget Functions
async function setBudget() {
    if (currentMember) {
        const budgetAmount = parseFloat(budgetInput.value);
        const timeframe = parseInt(budgetTimeframeSelect.value);
        if (!isNaN(budgetAmount) && budgetAmount > 0) {
            currentMember.budget = budgetAmount;
            currentMember.budgetTimeframe = timeframe;
            await saveFamilyMembers();
            updateBudgetInfo();
            showToast(`Budget set: ${formatCurrency(budgetAmount)} for ${getDurationText(timeframe)}`);
        } else {
            showToast('Please enter a valid budget amount');
        }
    } else {
        showToast('Please select a family member first');
    }
}

function updateBudgetInfo() {
    if (currentMember) {
        totalBudgetSpan.textContent = formatCurrency(currentMember.budget);
        const totalExpenses = currentMember.expenses.reduce((sum, expense) => sum + expense.amount, 0);
        const remainingBalance = currentMember.budget - totalExpenses;
        remainingBalanceSpan.textContent = formatCurrency(remainingBalance);
        const dailyLimit = currentMember.budget / currentMember.budgetTimeframe;
        dailyLimitSpan.textContent = formatCurrency(dailyLimit);
        budgetDurationSpan.textContent = getDurationText(currentMember.budgetTimeframe);
        updateExpenseList();
        updateSavingsTargetInfo();
    }
}

function getDurationText(days) {
    if (days === 7) return '1 Week';
    if (days === 14) return '2 Weeks';
    if (days === 30) return '1 Month';
    if (days === 90) return '3 Months';
    if (days === 180) return '6 Months';
    if (days === 365) return '1 Year';
    return `${days} Days`;
}

// Expense Functions
async function addExpense() {
    if (currentMember) {
        const amount = parseFloat(expenseAmountInput.value);
        const category = expenseCategorySelect.value;
        if (!isNaN(amount) && amount > 0 && category) {
            const expense = {
                amount,
                category,
                date: new Date().toISOString()
            };
            currentMember.expenses.push(expense);
            await saveFamilyMembers();
            updateBudgetInfo();
            expenseAmountInput.value = '';
            expenseCategorySelect.value = '';
            showToast(`Expense added: ${formatCurrency(amount)} for ${category}`);
            checkBudgetStatus();
        } else {
            showToast('Please enter a valid amount and select a category');
        }
    } else {
        showToast('Please select a family member first');
    }
}

function updateExpenseList() {
    expenseList.innerHTML = '';
    if (currentMember) {
        currentMember.expenses.forEach((expense, index) => {
            const div = document.createElement('div');
            div.className = 'expense-item';
            div.innerHTML = `
                <span>${formatCurrency(expense.amount)} - ${expense.category} (${new Date(expense.date).toLocaleDateString()})</span>
                <div>
                    <button onclick="editExpense(${index})">Edit</button>
                    <button onclick="deleteExpense(${index})">Delete</button>
                </div>
            `;
            expenseList.appendChild(div);
        });
    }
}

async function editExpense(index) {
    const expense = currentMember.expenses[index];
    const newAmount = prompt('Enter new amount:', expense.amount);
    const newCategory = prompt('Enter new category:', expense.category);
    if (newAmount && !isNaN(parseFloat(newAmount)) && newCategory) {
        expense.amount = parseFloat(newAmount);
        expense.category = newCategory;
        await saveFamilyMembers();
        updateBudgetInfo();
        showToast('Expense updated');
    } else {
        showToast('Invalid input');
    }
}

async function deleteExpense(index) {
    currentMember.expenses.splice(index, 1);
    await saveFamilyMembers();
    updateBudgetInfo();
    showToast('Expense deleted');
}

function checkBudgetStatus() {
    if (currentMember) {
        const totalExpenses = currentMember.expenses.reduce((sum, expense) => sum + expense.amount, 0);
        const remainingBalance = currentMember.budget - totalExpenses;
        const dailyLimit = currentMember.budget / currentMember.budgetTimeframe;
        const daysRemaining = Math.ceil(remainingBalance / dailyLimit);

        if (daysRemaining <= 3 && daysRemaining > 0) {
            showToast(`Warning: Only ${daysRemaining} days of budget remaining!`, 5000);
        } else if (remainingBalance <= 0) {
            showToast('Alert: Budget exceeded!', 5000);
        }
    }
}

// Savings Target Functions
async function setSavingsTarget() {
    if (currentMember) {
        const targetAmount = parseFloat(savingsTargetAmountInput.value);
        const targetDeadline = savingsTargetDeadlineInput.value;
        
        if (!isNaN(targetAmount) && targetAmount > 0 && targetDeadline) {
            currentMember.savingsTarget = {
                amount: targetAmount,
                deadline: new Date(targetDeadline).toISOString(),
                currentSavings: currentMember.savingsTarget ? currentMember.savingsTarget.currentSavings : 0
            };
            await saveFamilyMembers();
            updateSavingsTargetInfo();
            showToast(`Savings target set: ${formatCurrency(targetAmount)} by ${new Date(targetDeadline).toLocaleDateString()}`);
        } else {
            showToast('Please enter a valid target amount and deadline');
        }
    } else {
        showToast('Please select a family member first');
    }
}

function updateSavingsTargetInfo() {
    if (currentMember && currentMember.savingsTarget.amount > 0) {
        const { amount, deadline, currentSavings } = currentMember.savingsTarget;
        const remaining = amount - currentSavings;
        const daysRemaining = Math.ceil((new Date(deadline) - new Date()) / (1000 * 60 * 60 * 24));
        const dailySavingsNeeded = remaining / daysRemaining;

        savingsTargetInfo.innerHTML = `
            <h3>Savings Target</h3>
            <p>Target: ${formatCurrency(amount)}</p>
            <p>Deadline: ${new Date(deadline).toLocaleDateString()}</p>
            <p>Current Savings: ${formatCurrency(currentSavings)}</p>
            <p>Remaining: ${formatCurrency(remaining)}</p>
            <p>Days Remaining: ${daysRemaining}</p>
            <p>Daily Savings Needed: ${formatCurrency(dailySavingsNeeded)}</p>
            <div class="progress-bar">
                <div class="progress-bar-fill" style="width: ${(currentSavings / amount) * 100}%"></div>
            </div>
            ${generateEncouragement(currentSavings, amount, daysRemaining)}
        `;
    } else {
        savingsTargetInfo.innerHTML = '<p>No savings target set</p>';
    }
}

function generateEncouragement(currentSavings, targetAmount, daysRemaining) {
    const progress = currentSavings / targetAmount;
    let message = '';

    if (progress === 0) {
        message = "Every journey begins with a single step. Start your savings journey today!";
    } else if (progress < 0.25) {
        message = "Great start! Keep going, you're building good habits.";
    } else if (progress < 0.5) {
        message = "You're making solid progress. Stay consistent and you'll reach your goal!";
    } else if (progress < 0.75) {
        message = "You're more than halfway there! Your dedication is paying off.";
    } else if (progress < 1) {
        message = "The finish line is in sight! Keep pushing, you're almost there.";
    } else {
        message = "Congratulations! You've reached your savings target. Time to set a new goal!";
    }

    if (daysRemaining <= 7 && progress < 1) {
        message += " The deadline is approaching. Consider adjusting your target or increasing your savings rate.";
    }

    return `<p class="encouragement">${message}</p>`;
}

async function addSavings() {
    if (currentMember) {
        const amount = parseFloat(addSavingsAmountInput.value);
        if (!isNaN(amount) && amount > 0) {
            currentMember.savingsTarget.currentSavings += amount;
            await saveFamilyMembers();
            updateSavingsTargetInfo();
            showToast(`${formatCurrency(amount)} added to savings`);
        } else {
            showToast('Please enter a valid amount');
        }
    } else {
        showToast('Please select a family member first');
    }
}

// Analysis Functions
function analyzeCategorySpending(expenses, months = 3) {
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth() - months, 1);
    
    const relevantExpenses = expenses.filter(exp => new Date(exp.date) >= startDate);
    
    const categoryMonthlyTotals = {};
    relevantExpenses.forEach(exp => {
        const expDate = new Date(exp.date);
        const monthKey = `${expDate.getFullYear()}-${expDate.getMonth() + 1}`;
        if (!categoryMonthlyTotals[exp.category]) {
            categoryMonthlyTotals[exp.category] = {};
        }
        if (!categoryMonthlyTotals[exp.category][monthKey]) {
            categoryMonthlyTotals[exp.category][monthKey] = 0;
        }
        categoryMonthlyTotals[exp.category][monthKey] += exp.amount;
    });

    const categoryAnalysis = {};
    Object.keys(categoryMonthlyTotals).forEach(category => {
        const monthlyTotals = Object.values(categoryMonthlyTotals[category]);
        const average = monthlyTotals.reduce((sum, val) => sum + val, 0) / monthlyTotals.length;
        const variance = monthlyTotals.reduce((sum, val) => sum + Math.pow(val - average, 2), 0) / monthlyTotals.length;
        const standardDeviation = Math.sqrt(variance);

        categoryAnalysis[category] = {
            average: average,
            isConsistent: standardDeviation / average < 0.2,
            monthlyTotals: categoryMonthlyTotals[category]
        };
    });

    return categoryAnalysis;
}

function generateCategoryAnalysisReport() {
    if (currentMember) {
        const analysis = analyzeCategorySpending(currentMember.expenses);
        let report = `<h3>Category Spending Analysis for ${currentMember.name}</h3>`;

        const sortedCategories = Object.keys(analysis).sort((a, b) => analysis[b].average - analysis[a].average);

        report += `<table>
            <tr>
                <th>Category</th>
                <th>Average Monthly Spend</th>
                <th>Consistency</th>
                <th>Trend</th>
            </tr>`;

        sortedCategories.forEach(category => {
            const data = analysis[category];
            const consistency = data.isConsistent ? 'Consistent' : 'Variable';
            const trend = calculateTrend(data.monthlyTotals);

            report += `<tr>
                <td>${category}</td>
                <td>${formatCurrency(data.average)}</td>
                <td>${consistency}</td>
                <td>${trend}</td>
            </tr>`;
        });

        report += '</table>';

        report += '<div style="width: 80%; margin: auto;"><canvas id="categoryDistributionChart"></canvas></div>';
        report += '<div style="width: 80%; margin: auto;"><canvas id="topCategoriesOverTimeChart"></canvas></div>';

        reportContainer.innerHTML = report;

        createCategoryDistributionChart(analysis);
        createTopCategoriesOverTimeChart(analysis);

        showToast('Category analysis report generated');
    } else {
        showToast('Please select a family member first');
    }
}

function calculateTrend(monthlyTotals) {
    const sortedMonths = Object.keys(monthlyTotals).sort();
    if (sortedMonths.length < 2) return 'Not enough data';

    const firstMonth = monthlyTotals[sortedMonths[0]];
    const lastMonth = monthlyTotals[sortedMonths[sortedMonths.length - 1]];

    if (lastMonth > firstMonth * 1.1) return 'Increasing';
    if (lastMonth < firstMonth * 0.9) return 'Decreasing';
    return 'Stable';
}

function createCategoryDistributionChart(analysis) {
    const ctx = document.getElementById('categoryDistributionChart').getContext('2d');
    const labels = Object.keys(analysis);
    const data = labels.map(category => analysis[category].average);

    new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: generateColors(labels.length)
            }]
        },
        options: {
            responsive: true,
            title: {
                display: true,
                text: 'Category Distribution'
            }
        }
    });
}

function createTopCategoriesOverTimeChart(analysis) {
    const ctx = document.getElementById('topCategoriesOverTimeChart').getContext('2d');
    const sortedCategories = Object.keys(analysis).sort((a, b) => analysis[b].average - analysis[a].average);
    const topCategories = sortedCategories.slice(0, 5);

    const datasets = topCategories.map((category, index) => ({
        label: category,
        data: Object.values(analysis[category].monthlyTotals),
        borderColor: generateColors(1)[0],
        fill: false
    }));

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: Object.keys(analysis[topCategories[0]].monthlyTotals),
            datasets: datasets
        },
        options: {
            responsive: true,
            title: {
                display: true,
                text: 'Top 5 Categories Over Time'
            },
            scales: {
                yAxes: [{
                    ticks: {
                        beginAtZero: true
                    }
                }]
            }
        }
    });
}

function generateColors(count) {
    const colors = [];
    for (let i = 0; i < count; i++) {
        colors.push(`hsl(${(i * 360) / count}, 70%, 60%)`);
    }
    return colors;
}

function identifyPotentialSavings(analysis) {
    const potentialSavings = [];
    Object.keys(analysis).forEach(category => {
        const data = analysis[category];
        if (!data.isConsistent && data.average > 1000) {
            potentialSavings.push({
                category: category,
                averageSpend: data.average,
                potentialSaving: data.average * 0.1
            });
        }
    });
    return potentialSavings.sort((a, b) => b.potentialSaving - a.potentialSaving);
}

function generateSavingsReport() {
    if (currentMember) {
        const analysis = analyzeCategorySpending(currentMember.expenses);
        const potentialSavings = identifyPotentialSavings(analysis);
        let report = '<h3>Potential Savings Report</h3>';
        if (potentialSavings.length > 0) {
            report += '<ul>';
            potentialSavings.forEach(saving => {
                report += `<li>${saving.category}: Potential monthly saving of ${formatCurrency(saving.potentialSaving)} (Current average: ${formatCurrency(saving.averageSpend)})</li>`;
            });
            report += '</ul>';
        } else {
            report += '<p>No significant potential savings identified at this time.</p>';
        }
        reportContainer.innerHTML = report;
        showToast('Savings report generated');
    } else {
        showToast('Please select a family member first');
    }
}

function compareSpendingWithBudget(currentMember, analysis) {
    const totalMonthlySpend = Object.values(analysis).reduce((sum, category) => sum + category.average, 0);
    const monthlyBudget = currentMember.budget / (currentMember.budgetTimeframe / 30);
    const difference = monthlyBudget - totalMonthlySpend;
    
    return {
        totalMonthlySpend: totalMonthlySpend,
        monthlyBudget: monthlyBudget,
        difference: difference,
        isOverBudget: difference < 0
    };
}

function generateBudgetComparisonReport() {
    if (currentMember) {
        const analysis = analyzeCategorySpending(currentMember.expenses);
        const budgetComparison = compareSpendingWithBudget(currentMember, analysis);
        let report = '<h3>Budget Comparison</h3>';
        report += `<p>Monthly Budget: ${formatCurrency(budgetComparison.monthlyBudget)}</p>`;
        report += `<p>Average Monthly Spend: ${formatCurrency(budgetComparison.totalMonthlySpend)}</p>`;
        report += `<p>Difference: ${formatCurrency(Math.abs(budgetComparison.difference))} ${budgetComparison.isOverBudget ? 'over budget' : 'under budget'}</p>`;
        reportContainer.innerHTML = report;
        showToast('Budget comparison report generated');
    } else {
        showToast('Please select a family member first');
    }
}

// Event Listeners
familyMemberSelect.addEventListener('change', (e) => {
    const selectedName = e.target.value;
    currentMember = familyMembers.find(member => member.name === selectedName);
    if (currentMember) {
        updateBudgetInfo();
        showToast(`Selected family member: ${currentMember.name}`);
    }
});

submitNewMemberBtn.addEventListener('click', () => {
    addNewFamilyMember(newMemberNameInput.value);
    newMemberNameInput.value = '';
});

addCategoryBtn.addEventListener('click', () => {
    addCategory(newCategoryInput.value);
    newCategoryInput.value = '';
});

setBudgetBtn.addEventListener('click', setBudget);
addExpenseBtn.addEventListener('click', addExpense);
setSavingsTargetBtn.addEventListener('click', setSavingsTarget);
addSavingsBtn.addEventListener('click', addSavings);
generateCategoryAnalysisBtn.addEventListener('click', generateCategoryAnalysisReport);
generateSavingsReportBtn.addEventListener('click', generateSavingsReport);
generateBudgetComparisonBtn.addEventListener('click', generateBudgetComparisonReport);
themeToggle.addEventListener('click', toggleTheme);

// Initialize application
function initializeApp() {
    loadTheme();
    onAuthStateChanged(auth, (user) => {
        if (user) {
            currentUser = user;
            showAuthenticatedUI();
            loadCategories();
        } else {
            showUnauthenticatedUI();
        }
    });
    savingsTargetDeadlineInput.min = new Date().toISOString().split("T")[0];
    showToast('Application initialized');
}

// Call initializeApp when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', initializeApp);

// Expose functions for editing/deleting expenses globally
window.editExpense = editExpense;
window.deleteExpense = deleteExpense;

// Function to add dummy data for testing (remove in production)
async function addDummyData() {
    if (currentMember) {
        const categories = ['Milk', 'Gas', 'Car Fuel', 'Mobile Recharges', 'Internet Recharge', 'Claude', 'ChatGPT', 'Tobacco', 'Groceries'];
        const now = new Date();
        for (let i = 0; i < 100; i++) {
            const randomDate = new Date(now.getFullYear(), now.getMonth() - Math.floor(Math.random() * 3), Math.floor(Math.random() * 28) + 1);
            const randomCategory = categories[Math.floor(Math.random() * categories.length)];
            const randomAmount = Math.floor(Math.random() * 1000) + 100; // Random amount between 100 and 1100
            currentMember.expenses.push({
                amount: randomAmount,
                category: randomCategory,
                date: randomDate.toISOString()
            });
        }
        await saveFamilyMembers();
        updateBudgetInfo();
        showToast('Dummy data added');
    } else {
        showToast('Please select a family member first');
    }
}

// Add a button to insert dummy data (remember to remove this in the production version)
const addDummyDataBtn = document.createElement('button');
addDummyDataBtn.id = 'add-dummy-data';
addDummyDataBtn.textContent = 'Add Dummy Data';
addDummyDataBtn.addEventListener('click', addDummyData);
document.querySelector('.card:nth-child(4)').appendChild(addDummyDataBtn);
