// Sidebar Logic
const sidebar = document.getElementById('sidebar');
const backdrop = document.getElementById('sidebarBackdrop');
let isSidebarOpen = false;

window.toggleSidebar = function() {
    isSidebarOpen = !isSidebarOpen;
    const sidebar = document.getElementById('sidebar');
    const backdrop = document.getElementById('sidebarBackdrop');
    
    if (isSidebarOpen) {
        sidebar.classList.remove('-translate-x-full');
        backdrop.classList.remove('hidden');
        setTimeout(() => backdrop.classList.remove('opacity-0'), 10);
    } else {
        sidebar.classList.add('-translate-x-full');
        backdrop.classList.add('opacity-0');
        setTimeout(() => backdrop.classList.add('hidden'), 300);
    }
}

let categoryChart = null;

// Function to update Dashboard UI with specific period data
async function updateDashboard(periodKey) {
    
    // Fetch fresh data with timestamp to prevent caching
    let allData;
    try {
        const timestamp = new Date().getTime();
        const response = await fetch(`js/data.json?v=${timestamp}`);
        if (!response.ok) throw new Error('Network response was not ok');
        allData = await response.json();
    } catch (err) {
        console.error("Failed to fetch fresh data:", err);
        return;
    }

    const data = allData[periodKey];
    if (!data) {
        console.error("No data found for periodKey:", periodKey);
        // Fallback to zero values if period not found
         document.getElementById('sisaVal').innerText = "Rp 0";
         document.getElementById('terpakaiVal').innerText = "Rp 0";
         document.getElementById('budgetVal').innerText = "Rp 0";
        return;
    }

    // Update Cards
    const sisaEl = document.getElementById('sisaVal');
    const terpakaiEl = document.getElementById('terpakaiVal');
    const budgetEl = document.getElementById('budgetVal');
    
    // Format currency
    const formatRp = (num) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num).replace('Rp', 'Rp ');

    if (sisaEl) sisaEl.innerText = formatRp(data.sisa);
    if (terpakaiEl) terpakaiEl.innerText = formatRp(data.totalSpent);
    if (budgetEl) budgetEl.innerText = formatRp(data.budget);
    
    // Update Badge (Terpakai %)
    const badge = document.getElementById('terpakaiBadge');
    if (badge) badge.innerHTML = `<i class="ri-fire-fill"></i> ${data.percentSpent}% dari budget`;

    // Update Sisa Badge
    const sisaBadge = document.getElementById('sisaBadge');
    if (sisaBadge) {
         if (data.sisa <= 0) {
             sisaBadge.className = "mt-4 flex items-center gap-2 text-xs font-medium text-danger bg-red-50 w-fit px-2 py-1 rounded-md";
             sisaBadge.innerHTML = `<i class="ri-alarm-warning-fill"></i> Over Budget!`;
         } else if (data.sisa < 200000) {
             sisaBadge.className = "mt-4 flex items-center gap-2 text-xs font-medium text-warning bg-yellow-50 w-fit px-2 py-1 rounded-md";
             sisaBadge.innerHTML = `<i class="ri-alert-fill"></i> Menipis`;
         } else {
             sisaBadge.className = "mt-4 flex items-center gap-2 text-xs font-medium text-success bg-green-50 w-fit px-2 py-1 rounded-md";
             sisaBadge.innerHTML = `<i class="ri-thumb-up-fill"></i> Aman`;
         }
    }

    // Update Status Cards
    const safeCategories = data.categories || [];
    const topCategory = safeCategories.length > 0 ? safeCategories[0].name : 'Belum ada data';

    let insightStatus = '';
    let insightSaran = '';

    // Dynamic Insight Logic
    const topCatName = topCategory;
    const isNewPeriod = data.totalSpent === 0 || (data.categories.length === 1 && data.categories[0].name === 'Tabungan');
    
    if (data.sisa <= 0) {
        insightStatus = `Sisa budget Tuan sudah <strong>habis (Minus)</strong>. Mohon segera evaluasi pengeluaran. 🚨`;
        insightSaran = `Kategori <strong>${topCatName}</strong> menyerap dana paling banyak. Stop pengeluaran non-essential. 🛑`;
    } else if (data.sisa < 500000) {
        insightStatus = `Sisa budget Tuan menipis (<strong>${formatRp(data.sisa)}</strong>). Cukup untuk kebutuhan mendesak. 🛡️`;
        insightSaran = `Pengeluaran <strong>${topCatName}</strong> cukup tinggi. Masak di rumah bisa jadi solusi hemat! 🍳`;
    } else if (isNewPeriod) {
        insightStatus = `Periode baru dimulai! Saldo Tuan masih utuh (<strong>${formatRp(data.sisa)}</strong>). ✨`;
        insightSaran = `Belum ada pengeluaran signifikan. Saat yang tepat untuk menabung lebih awal! 💰`;
    } else {
        insightStatus = `Keuangan Tuan sehat! Sisa budget masih aman (<strong>${formatRp(data.sisa)}</strong>). 🥂`;
        
        // Context-aware advice
        if (topCatName === 'Makan') {
            insightSaran = `Kategori <strong>Makan</strong> mendominasi. Coba kurangi jajan di luar minggu depan ya Tuan. 🥗`;
        } else if (topCatName === 'Hiburan') {
            insightSaran = `Wah, <strong>Hiburan</strong> jadi top pengeluaran. Ingat target tabungan nikah Tuan! 🎬`;
        } else if (topCatName === 'Tabungan') {
            insightSaran = `Mantap! <strong>Tabungan</strong> jadi prioritas utama. Pertahankan disiplin ini Tuan! 💎`;
        } else {
            insightSaran = `Pengeluaran terbesar di <strong>${topCatName}</strong>. Pastikan tetap sesuai rencana anggaran ya. 📝`;
        }
    }
    
    // Helper to update insight text safely
    const updateInsight = (titleText, contentHtml) => {
        const titles = Array.from(document.querySelectorAll('.text-xs.font-bold.text-text-light'));
        const targetTitle = titles.find(el => el.textContent.trim().toUpperCase() === titleText.toUpperCase());
        if (targetTitle && targetTitle.nextElementSibling) {
            targetTitle.nextElementSibling.innerHTML = contentHtml;
        } else {
             console.warn("Could not find insight title element for:", titleText);
        }
    };

    updateInsight("Status Mingguan", insightStatus);
    updateInsight("Saran Hemat", insightSaran);

    // Update Top Pengeluaran List
    const icons = {
        'Makan': 'ri-restaurant-line',
        'Hiburan': 'ri-movie-line',
        'Parkir': 'ri-parking-box-line',
        'Tabungan': 'ri-bank-line',
        'Transportasi': 'ri-car-line',
        'Belanja': 'ri-shopping-bag-3-line',
        'Tagihan': 'ri-bill-line'
    };
    const colors = {
        'Makan': 'blue',
        'Hiburan': 'green',
        'Parkir': 'yellow',
        'Tabungan': 'purple',
        'Transportasi': 'red',
        'Belanja': 'pink',
        'Tagihan': 'indigo'
    };

    let topListHtml = '';
    if (safeCategories.length === 0) {
        topListHtml = '<div class="p-3 text-center text-sm text-text-light">Belum ada transaksi.</div>';
    } else {
        safeCategories.slice(0, 5).forEach(cat => {
            const icon = icons[cat.name] || 'ri-bill-line';
            const color = colors[cat.name] || 'gray';
            topListHtml += `
            <div class="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded-full bg-${color}-100 text-${color}-600 flex items-center justify-center"><i class="${icon}"></i></div>
                    <span class="text-sm font-medium text-text-dark">${cat.name}</span>
                </div>
                <span class="text-sm font-bold text-text-dark">${formatRp(cat.value)}</span>
            </div>`;
        });
    }

    const topListContainer = document.querySelector('.space-y-3');
    if (topListContainer) {
        // Find the parent container of the list items or the list container itself
        // The HTML structure has a div with class space-y-3 containing the items
        // We can just replace its content
        topListContainer.innerHTML = topListHtml; 
    }

    // Update Chart
    if (categoryChart) {
        categoryChart.data.labels = safeCategories.map(c => c.name);
        categoryChart.data.datasets[0].data = safeCategories.map(c => c.value);
        categoryChart.update();
    }
}

// Initialize Dashboard
document.addEventListener('DOMContentLoaded', async function() {
    try {
        const periodSelect = document.getElementById('periodSelect');
        if (periodSelect) {
            periodSelect.addEventListener('change', (e) => {
                updateDashboard(e.target.value);
            });
            // Initial load
            updateDashboard(periodSelect.value);
        } else {
            console.error("Dropdown element 'periodSelect' NOT found!");
        }

        const ctx = document.getElementById('categoryChart');
        if (ctx) {
             // Chart init logic
            categoryChart = new Chart(ctx.getContext('2d'), {
                type: 'doughnut',
                data: {
                    labels: [],
                    datasets: [{
                        data: [],
                        backgroundColor: ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444', '#6B7280'],
                        borderWidth: 0,
                        hoverOffset: 15
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: '75%',
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: {
                                usePointStyle: true,
                                pointStyle: 'circle',
                                padding: 20,
                                font: {
                                    family: "'Plus Jakarta Sans', sans-serif",
                                    size: 12,
                                    weight: 500
                                },
                                color: '#1F2937'
                            }
                        },
                        tooltip: {
                            backgroundColor: '#1F2937',
                            padding: 12,
                            titleFont: { family: "'Plus Jakarta Sans', sans-serif", size: 13 },
                            bodyFont: { family: "'Plus Jakarta Sans', sans-serif", size: 13 },
                            cornerRadius: 8,
                            displayColors: false,
                            callbacks: {
                                label: function(context) {
                                    let label = context.label || '';
                                    if (label) label += ': ';
                                    if (context.parsed !== null) {
                                        label += new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(context.parsed);
                                    }
                                    return label;
                                }
                            }
                        }
                    },
                    animation: {
                        animateScale: true,
                        animateRotate: true
                    }
                }
            });
        }
    } catch (err) {
        console.error('Failed to initialize dashboard:', err);
    }
});
