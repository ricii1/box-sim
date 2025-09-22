class BoxSimulation {
    constructor() {
        this.maxCounts = {
            fake: 1,
            r1: 3,
            r2: 4
        };
        
        this.currentCounts = {
            fake: 0,
            r1: 0,
            r2: 0
        };
        
        this.squares = [];
        this.init();
    }
    
    init() {
        this.createMap();
        this.setupEventListeners();
        this.updateCounters();
    }
    
    createMap() {
        const mapElement = document.getElementById('map');
        
        // Array 2D untuk konfigurasi kotak (3 kolom x 4 baris)
        // Anda bisa mengubah nilai-nilai ini sesuai kebutuhan
        this.mapConfig = [
            [20, 40, 20],   // Baris 4
            [40, 60, 40],  // Baris 3
            [20, 40, 60],  // Baris 2  
            [40, 20, 40]  // Baris 1
        ];
        
        // Buat 12 persegi (3x4)
        for (let i = 0; i < 12; i++) {
            const square = document.createElement('div');
            square.className = 'square';
            square.dataset.index = i;
            
            // Hitung posisi row dan column dari index
            const row = Math.floor(i / 3);
            const col = i % 3;
            const value = this.mapConfig[row][col];
            
            // Assign type berdasarkan array 2D
            square.classList.add(`type-${value}`);
            square.dataset.value = value;
            square.dataset.placeholder = `Kotak ${value}`;
            
            square.addEventListener('click', () => this.handleSquareClick(square));
            square.addEventListener('dragover', (e) => this.handleDragOver(e, square));
            square.addEventListener('drop', (e) => this.handleDrop(e, square));
            square.addEventListener('dragenter', (e) => this.handleDragEnter(e, square));
            square.addEventListener('dragleave', (e) => this.handleDragLeave(e, square));
            
            this.squares.push(square);
            mapElement.appendChild(square);
        }
    }
    
    setupEventListeners() {
        // Setup drag events untuk lingkaran
        const circles = document.querySelectorAll('.circle');
        circles.forEach(circle => {
            circle.addEventListener('dragstart', (e) => this.handleDragStart(e, circle));
            circle.addEventListener('click', () => this.selectCircle(circle));
        });
        
        // Reset button
        document.getElementById('resetBtn').addEventListener('click', () => this.resetAll());
        
        // Prevent default drag behavior
        document.addEventListener('dragover', (e) => e.preventDefault());
    }
    
    handleDragStart(e, circle) {
        if (circle.classList.contains('disabled')) {
            e.preventDefault();
            return;
        }
        
        const type = circle.dataset.type;
        e.dataTransfer.setData('text/plain', type);
        e.dataTransfer.effectAllowed = 'copy';
        
        // Visual feedback
        circle.style.opacity = '0.5';
        setTimeout(() => {
            circle.style.opacity = '1';
        }, 100);
    }
    
    handleDragOver(e, square) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
    }
    
    handleDragEnter(e, square) {
        e.preventDefault();
        if (!square.classList.contains('occupied')) {
            square.classList.add('drag-over');
        }
    }
    
    handleDragLeave(e, square) {
        if (!square.contains(e.relatedTarget)) {
            square.classList.remove('drag-over');
        }
    }
    
    handleDrop(e, square) {
        e.preventDefault();
        square.classList.remove('drag-over');
        
        if (square.classList.contains('occupied')) {
            this.showError('Persegi sudah terisi!');
            return;
        }
        
        const type = e.dataTransfer.getData('text/plain');
        this.placeCircleOnSquare(square, type);
    }
    
    selectCircle(circle) {
        if (circle.classList.contains('disabled')) {
            return;
        }
        
        // Remove previous selection
        document.querySelectorAll('.circle').forEach(c => c.classList.remove('selected'));
        
        // Add selection to clicked circle
        circle.classList.add('selected');
        
        // Change cursor for squares
        this.squares.forEach(square => {
            if (!square.classList.contains('occupied')) {
                square.style.cursor = 'crosshair';
            }
        });
    }
    
    handleSquareClick(square) {
        const selectedCircle = document.querySelector('.circle.selected');
        
        if (!selectedCircle) {
            // If square is occupied, remove the circle
            if (square.classList.contains('occupied')) {
                this.removeCircleFromSquare(square);
            }
            return;
        }
        
        if (square.classList.contains('occupied')) {
            this.showError('Persegi sudah terisi!');
            return;
        }
        
        const type = selectedCircle.dataset.type;
        this.placeCircleOnSquare(square, type);
        
        // Remove selection
        selectedCircle.classList.remove('selected');
        this.squares.forEach(s => s.style.cursor = 'pointer');
    }
    
    placeCircleOnSquare(square, type) {
        // Check if we can place this type
        if (this.currentCounts[type] >= this.maxCounts[type]) {
            this.showError(`Maksimal ${this.maxCounts[type]} lingkaran ${type.toUpperCase()}!`);
            this.updateErrorState();
            return;
        }
        
        // Create circle element
        const placedCircle = document.createElement('div');
        placedCircle.className = `placed-circle ${type}`;
        placedCircle.textContent = type === 'fake' ? 'Fake' : type.toUpperCase();
        placedCircle.dataset.type = type;
        
        // Add remove functionality
        placedCircle.addEventListener('click', (e) => {
            e.stopPropagation();
            this.removeCircleFromSquare(square);
        });
        
        // Place circle
        square.appendChild(placedCircle);
        square.classList.add('occupied');
        square.dataset.type = type;
        
        // Update count
        this.currentCounts[type]++;
        this.updateCounters();
        this.updateCircleStates();
        this.checkErrorState();
        
        this.showSuccess(`${type.toUpperCase()} ditempatkan!`);
    }
    
    removeCircleFromSquare(square) {
        const placedCircle = square.querySelector('.placed-circle');
        if (!placedCircle) return;
        
        const type = placedCircle.dataset.type;
        
        // Remove circle
        placedCircle.remove();
        square.classList.remove('occupied');
        delete square.dataset.type;
        
        // Update count
        this.currentCounts[type]--;
        this.updateCounters();
        this.updateCircleStates();
        this.checkErrorState();
        
        this.showInfo(`${type.toUpperCase()} dihapus!`);
    }
    
    updateCounters() {
        Object.keys(this.maxCounts).forEach(type => {
            const remaining = this.maxCounts[type] - this.currentCounts[type];
            const counter = document.getElementById(`${type}Counter`);
            counter.textContent = `Tersisa: ${remaining}`;
            
            if (remaining === 0) {
                counter.classList.add('warning');
            } else {
                counter.classList.remove('warning');
            }
        });
    }
    
    updateCircleStates() {
        Object.keys(this.maxCounts).forEach(type => {
            const circle = document.querySelector(`.circle[data-type="${type}"]`);
            const remaining = this.maxCounts[type] - this.currentCounts[type];
            
            if (remaining === 0) {
                circle.classList.add('disabled');
            } else {
                circle.classList.remove('disabled');
            }
        });
    }
    
    checkErrorState() {
        const container = document.getElementById('circlesContainer');
        const hasExcess = Object.keys(this.maxCounts).some(type => 
            this.currentCounts[type] > this.maxCounts[type]
        );
        
        if (hasExcess) {
            container.classList.add('error');
        } else {
            container.classList.remove('error');
        }
    }
    
    updateErrorState() {
        this.checkErrorState();
        setTimeout(() => {
            document.getElementById('circlesContainer').classList.remove('error');
        }, 2000);
    }
    
    resetAll() {
        // Clear all squares
        this.squares.forEach(square => {
            const placedCircle = square.querySelector('.placed-circle');
            if (placedCircle) {
                placedCircle.remove();
            }
            square.classList.remove('occupied', 'drag-over');
            delete square.dataset.type;
            square.style.cursor = 'pointer';
        });
        
        // Reset counts
        Object.keys(this.currentCounts).forEach(type => {
            this.currentCounts[type] = 0;
        });
        
        // Remove selections
        document.querySelectorAll('.circle').forEach(c => c.classList.remove('selected'));
        
        // Update UI
        this.updateCounters();
        this.updateCircleStates();
        this.checkErrorState();
        
        this.showInfo('Semua direset!');
    }
    
    showError(message) {
        this.showNotification(message, 'error');
    }
    
    showSuccess(message) {
        this.showNotification(message, 'success');
    }
    
    showInfo(message) {
        this.showNotification(message, 'info');
    }
    
    showNotification(message, type) {
        // Remove existing notifications
        const existing = document.querySelector('.notification');
        if (existing) {
            existing.remove();
        }
        
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            border-radius: 6px;
            color: white;
            font-weight: bold;
            z-index: 1000;
            animation: slideIn 0.3s ease-out;
            max-width: 300px;
        `;
        
        const colors = {
            error: '#dc3545',
            success: '#28a745',
            info: '#17a2b8'
        };
        
        notification.style.background = colors[type] || colors.info;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease-in forwards';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 300);
        }, 3000);
        
        // Add animations to head if not exists
        if (!document.querySelector('#notificationStyles')) {
            const style = document.createElement('style');
            style.id = 'notificationStyles';
            style.textContent = `
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes slideOut {
                    from { transform: translateX(0); opacity: 1; }
                    to { transform: translateX(100%); opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }
    }
    
    // Method untuk mengatur jenis kotak secara manual
    setSquareType(index, type, value) {
        if (index < 0 || index >= this.squares.length) {
            console.error('Index kotak tidak valid');
            return;
        }
        
        const square = this.squares[index];
        const types = ['type-20', 'type-40', 'type-60'];
        
        // Hapus class type yang lama
        square.classList.remove(...types);
        
        // Tambah class type yang baru
        square.classList.add(`type-${type}`);
        square.dataset.value = value;
        square.dataset.placeholder = `Kotak ${type}`;
        
        // Update array 2D juga
        const row = Math.floor(index / 3);
        const col = index % 3;
        this.mapConfig[row][col] = type;
        
        console.log(`Kotak ${index} (row ${row}, col ${col}) diset ke type ${type} dengan value ${value}`);
    }
    
    // Method untuk mengatur array 2D secara langsung
    setMapConfig(newConfig) {
        if (!Array.isArray(newConfig) || newConfig.length !== 4) {
            console.error('Config harus berupa array 2D dengan 4 baris');
            return;
        }
        
        for (let row of newConfig) {
            if (!Array.isArray(row) || row.length !== 3) {
                console.error('Setiap baris harus berupa array dengan 3 kolom');
                return;
            }
        }
        
        this.mapConfig = newConfig;
        this.refreshMap();
        console.log('Map config berhasil diupdate:', this.mapConfig);
    }
    
    // Method untuk refresh tampilan map berdasarkan config
    refreshMap() {
        this.squares.forEach((square, index) => {
            const row = Math.floor(index / 3);
            const col = index % 3;
            const value = this.mapConfig[row][col];
            
            // Clear existing types
            const types = ['type-20', 'type-40', 'type-60'];
            square.classList.remove(...types);
            
            // Set new type
            square.classList.add(`type-${value}`);
            square.dataset.value = value;
            square.dataset.placeholder = `Kotak ${value}`;
        });
    }
    
    // Method untuk mendapatkan array 2D config saat ini
    getMapConfig() {
        return this.mapConfig;
    }
    
    // Method untuk mendapatkan konfigurasi current map
    getMapConfiguration() {
        return this.squares.map((square, index) => {
            const typeClass = square.className.match(/type-(\d+)/);
            const type = typeClass ? typeClass[1] : 'unknown';
            return {
                index: index,
                type: type,
                value: square.dataset.value,
                occupied: square.classList.contains('occupied'),
                placedType: square.dataset.type || null
            };
        });
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.boxSim = new BoxSimulation();
    
    // Console helper untuk development
    console.log('Box Simulation loaded!');
    console.log('=== CARA MENGGUNAKAN ARRAY 2D ===');
    console.log('1. Lihat config saat ini: window.boxSim.getMapConfig()');
    console.log('2. Set config baru: window.boxSim.setMapConfig([[20,40,60],[20,40,60],[20,40,60],[20,40,60]])');
    console.log('3. Set kotak individual: window.boxSim.setSquareType(index, type, value)');
    console.log('4. Lihat konfigurasi detail: window.boxSim.getMapConfiguration()');
    console.log('');
    console.log('Contoh config custom:');
    console.log('window.boxSim.setMapConfig([');
    console.log('  [20, 20, 20],  // Baris 1: semua 20');
    console.log('  [40, 40, 40],  // Baris 2: semua 40'); 
    console.log('  [60, 60, 60],  // Baris 3: semua 60');
    console.log('  [20, 40, 60]   // Baris 4: campuran');
    console.log(']);');
});