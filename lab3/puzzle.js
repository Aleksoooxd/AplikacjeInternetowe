// Zmienne globalne
let map;
let userMarker;
let currentLocation = null;
let puzzlePieces = [];
let correctPositions = 0;

// Inicjalizacja mapy
function initMap() {
    // Domyślna lokalizacja (Warszawa)
    map = L.map('map').setView([52.2297, 21.0122], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
    }).addTo(map);
}

// Prośba o zgodę na lokalizację
function requestLocationPermission() {
    if (!navigator.geolocation) {
        alert('Twoja przeglądarka nie obsługuje geolokalizacji!');
        return;
    }

    navigator.geolocation.getCurrentPosition(
        (position) => {
            console.log('Lokalizacja przyznana:', position.coords);
            currentLocation = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            };
        },
        (error) => {
            console.warn('Błąd geolokalizacji:', error.message);
            alert('Nie udało się pobrać lokalizacji. Używam domyślnej (Warszawa).');
        }
    );
}

// Obsługa przycisku zgody na powiadomienia
function handleNotificationButton() {
    if (!('Notification' in window)) {
        alert('Twoja przeglądarka nie obsługuje powiadomień!');
        return;
    }

    const notificationBtn = document.getElementById('notificationBtn');

    if (Notification.permission === 'granted') {
        notificationBtn.textContent = '✅ Powiadomienia włączone';
        notificationBtn.classList.add('granted');
        notificationBtn.disabled = true;
        return;
    }

    if (Notification.permission === 'denied') {
        alert('Powiadomienia zostały zablokowane. Odblokuj je w ustawieniach przeglądarki.');
        return;
    }

    Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
            notificationBtn.textContent = '✅ Powiadomienia włączone';
            notificationBtn.classList.add('granted');
            notificationBtn.disabled = true;

            // Testowe powiadomienie
            new Notification('Powiadomienia włączone!', {
                body: 'Teraz będziesz otrzymywać powiadomienia o ukończeniu puzzli.',
                icon: 'https://cdn-icons-png.flaticon.com/512/148/148767.png'
            });
        } else {
            notificationBtn.textContent = '❌ Powiadomienia odrzucone';
        }
    });
}

// Sprawdzenie stanu powiadomień przy starcie
function checkNotificationStatus() {
    if (!('Notification' in window)) {
        return;
    }

    const notificationBtn = document.getElementById('notificationBtn');

    if (Notification.permission === 'granted') {
        notificationBtn.textContent = '✅ Powiadomienia włączone';
        notificationBtn.classList.add('granted');
        notificationBtn.disabled = true;
    } else if (Notification.permission === 'denied') {
        notificationBtn.textContent = '❌ Powiadomienia zablokowane';
    }
}

// Prośba o zgodę na powiadomienia (automatyczna przy starcie - opcjonalna)
function requestNotificationPermission() {
    if (!('Notification' in window)) {
        return;
    }

    // Automatyczne pytanie tylko jeśli jeszcze nie zadano pytania
    if (Notification.permission === 'default') {
        Notification.requestPermission().then(permission => {
            checkNotificationStatus();
        });
    }
}

// Wyświetlenie mojej lokalizacji
function showMyLocation() {
    if (!navigator.geolocation) {
        alert('Geolokalizacja nie jest dostępna!');
        return;
    }

    navigator.geolocation.getCurrentPosition(
        (position) => {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;

            // Wyświetlenie współrzędnych
            document.getElementById('coordinates').innerHTML =
                `📍 Twoja lokalizacja: ${lat.toFixed(6)}, ${lng.toFixed(6)}`;

            // Centrowanie mapy
            map.setView([lat, lng], 15);

            // Usunięcie poprzedniego markera
            if (userMarker) {
                map.removeLayer(userMarker);
            }

            // Dodanie nowego markera
            userMarker = L.marker([lat, lng]).addTo(map)
                .bindPopup('Jesteś tutaj!')
                .openPopup();
        },
        (error) => {
            alert('Nie udało się pobrać lokalizacji: ' + error.message);
        }
    );
}

// Pobranie mapy jako obrazu i utworzenie puzzli
function downloadMap() {
    // Sprawdzenie czy leaflet-image jest dostępne
    if (typeof leafletImage === 'undefined') {
        console.warn('Biblioteka leaflet-image nie jest załadowana. Tworzę puzzle bez niej.');
        createPuzzleWithoutLeafletImage();
        return;
    }

    leafletImage(map, function(err, canvas) {
        if (err) {
            console.error('Błąd przy tworzeniu obrazu mapy:', err);
            createPuzzleWithoutLeafletImage();
            return;
        }

        // Przeskalowanie do 600x450
        const targetCanvas = document.createElement('canvas');
        targetCanvas.width = 600;
        targetCanvas.height = 450;
        const ctx = targetCanvas.getContext('2d');
        ctx.drawImage(canvas, 0, 0, 600, 450);

        const imageUrl = targetCanvas.toDataURL('image/png');

        // EKSPORT MAPY - Pobranie obrazu rastrowego
        const downloadLink = document.createElement('a');
        downloadLink.href = imageUrl;
        downloadLink.download = 'mapa_' + new Date().getTime() + '.png';
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);

        console.log('✅ Mapa została wyeksportowana jako obraz PNG');
        console.log('Rozmiar obrazu: 600x450px');
        console.log('Czas eksportu:', new Date().toLocaleString('pl-PL'));

        // Utworzenie puzzli z tego samego obrazu
        createPuzzle(imageUrl);
    });
}

// Alternatywna metoda - zrzut ekranu mapy
function createPuzzleWithoutLeafletImage() {
    // Używamy html2canvas jako fallback lub tworzymy placeholder
    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 450;
    const ctx = canvas.getContext('2d');

    // Tło gradientowe jako placeholder
    const gradient = ctx.createLinearGradient(0, 0, 600, 450);
    gradient.addColorStop(0, '#4CAF50');
    gradient.addColorStop(1, '#2196F3');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 600, 450);

    // Dodanie tekstu
    ctx.fillStyle = 'white';
    ctx.font = 'bold 30px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('MAPA', 300, 225);

    const imageUrl = canvas.toDataURL();
    createPuzzle(imageUrl);
}

// Utworzenie puzzli z obrazu
function createPuzzle(imageUrl) {
    const puzzleArea = document.getElementById('puzzleArea');
    const puzzleTable = document.getElementById('puzzleTable');
    const puzzleContainer = document.getElementById('puzzleContainer');
    const tableTitle = document.getElementById('tableTitle');

    puzzleArea.innerHTML = '';
    puzzleTable.innerHTML = '';
    puzzlePieces = [];
    correctPositions = 0;

    // Utworzenie 16 slotów (4x4)
    for (let i = 0; i < 16; i++) {
        const slot = document.createElement('div');
        slot.className = 'puzzle-slot';
        slot.dataset.position = i;

        // Obsługa drop
        slot.addEventListener('dragover', handleDragOver);
        slot.addEventListener('drop', handleDrop);

        puzzleArea.appendChild(slot);
    }

    // Utworzenie 16 elementów puzzli
    const positions = Array.from({length: 16}, (_, i) => i);
    // Wymieszanie pozycji
    shuffleArray(positions);

    positions.forEach((originalPos, index) => {
        const piece = document.createElement('div');
        piece.className = 'puzzle-piece';
        piece.draggable = true;
        piece.dataset.correctPosition = originalPos;

        // Obliczenie pozycji w siatce 4x4
        const row = Math.floor(originalPos / 4);
        const col = originalPos % 4;

        piece.style.backgroundImage = `url(${imageUrl})`;
        piece.style.backgroundPosition = `-${col * 150}px -${row * 112.5}px`;

        // Obsługa drag
        piece.addEventListener('dragstart', handleDragStart);
        piece.addEventListener('dragend', handleDragEnd);

        puzzleTable.appendChild(piece);
        puzzlePieces.push(piece);
    });

    // Pokazanie sekcji puzzli
    puzzleContainer.classList.add('active');
    tableTitle.style.display = 'block';

    updateProgress();
}

// Funkcja mieszająca tablicę
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

// Obsługa rozpoczęcia przeciągania
function handleDragStart(e) {
    // Sprawdź czy element jest zablokowany - jeśli tak, nie pozwól na przeciąganie
    if (this.dataset.locked === 'true') {
        e.preventDefault();
        return false;
    }

    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', this.dataset.correctPosition);
    this.classList.add('dragging');
}

// Obsługa zakończenia przeciągania
function handleDragEnd(e) {
    this.classList.remove('dragging');
}

// Obsługa przeciągania nad slotem
function handleDragOver(e) {
    if (e.preventDefault) {
        e.preventDefault();
    }
    e.dataTransfer.dropEffect = 'move';
    return false;
}

// Obsługa upuszczenia
function handleDrop(e) {
    if (e.stopPropagation) {
        e.stopPropagation();
    }
    e.preventDefault();

    const correctPosition = e.dataTransfer.getData('text/html');
    const targetSlot = e.currentTarget;
    const slotPosition = targetSlot.dataset.position;

    // Znalezienie przeciąganego elementu
    const draggedPiece = document.querySelector('.puzzle-piece.dragging');
    if (!draggedPiece) {
        const allPieces = document.querySelectorAll('.puzzle-piece');
        for (let piece of allPieces) {
            if (piece.dataset.correctPosition === correctPosition) {
                movePieceToSlot(piece, targetSlot, slotPosition);
                break;
            }
        }
    } else {
        movePieceToSlot(draggedPiece, targetSlot, slotPosition);
    }

    return false;
}

// Przeniesienie elementu do slotu
function movePieceToSlot(piece, slot, slotPosition) {
    // Sprawdź czy przeciągany element jest zablokowany
    if (piece.dataset.locked === 'true') {
        console.log('❌ Nie można przenieść zablokowanego elementu');
        return;
    }

    // Sprawdź czy slot ma już poprawnie ułożony element - jeśli tak, nie pozwól go zamienić
    const existingPiece = slot.querySelector('.puzzle-piece');
    if (existingPiece && existingPiece.dataset.locked === 'true') {
        // Element jest zablokowany - nie można go zastąpić
        console.log('❌ Slot zawiera zablokowany element - nie można zastąpić');
        return;
    }

    // Jeśli slot jest zajęty przez inny (niezablokowany) element, przenieś go z powrotem na stół
    if (existingPiece) {
        // Resetuj stan poprzedniego elementu
        if (existingPiece.dataset.wasCorrect === 'true') {
            correctPositions--;
            existingPiece.dataset.wasCorrect = 'false';
            existingPiece.dataset.locked = 'false';
            existingPiece.draggable = true;
            existingPiece.style.cursor = 'move';
        }
        document.getElementById('puzzleTable').appendChild(existingPiece);
    }

    // Usuń wszystkie klasy ze slotu przed wstawieniem
    slot.classList.remove('filled', 'correct');

    // Umieść nowy element w slocie
    slot.appendChild(piece);
    slot.classList.add('filled');

    // Sprawdź czy element jest na właściwym miejscu
    const isCorrect = piece.dataset.correctPosition === slotPosition;

    if (isCorrect) {
        // Element jest POPRAWNIE ułożony
        console.log('✅ Element ' + slotPosition + ' ułożony poprawnie!');

        if (piece.dataset.wasCorrect !== 'true') {
            piece.dataset.wasCorrect = 'true';
            correctPositions++;
        }

        // Zablokuj element - nie można go już ruszyć
        piece.dataset.locked = 'true';
        piece.draggable = false;
        piece.style.cursor = 'not-allowed';
        piece.style.opacity = '1';

        // DODAJ zielone podświetlenie TYLKO dla zablokowanych, poprawnych elementów
        slot.classList.add('correct');
    } else {
        // Element jest ŹLE ułożony
        console.log('⚠️ Element ułożony w złym miejscu (pozycja ' + piece.dataset.correctPosition + ' zamiast ' + slotPosition + ')');

        if (piece.dataset.wasCorrect === 'true') {
            correctPositions--;
        }

        piece.dataset.wasCorrect = 'false';
        piece.dataset.locked = 'false';
        piece.draggable = true;
        piece.style.cursor = 'move';

        // NIE dodawaj klasy 'correct' - upewnij się że została usunięta
        slot.classList.remove('correct');
    }

    updateProgress();
    checkCompletion();
}

// Aktualizacja paska postępu
function updateProgress() {
    document.getElementById('progress').textContent =
        `Poprawnie ułożonych: ${correctPositions}/16`;
}

// Sprawdzenie czy puzzle są ułożone
function checkCompletion() {
    if (correctPositions === 16) {
        setTimeout(() => {
            showCompletionNotification();
        }, 500);
    }
}

// Wyświetlenie powiadomienia o ukończeniu
function showCompletionNotification() {
    console.log('🎉 PUZZLE UŁOŻONE! Wszystkie 16 elementów zostało poprawnie ułożonych.');
    console.log('Czas ukończenia:', new Date().toLocaleString('pl-PL'));

    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('🎉 Gratulacje!', {
            body: 'Udało Ci się ułożyć wszystkie elementy puzzli!',
            icon: 'https://cdn-icons-png.flaticon.com/512/148/148767.png',
            requireInteraction: true
        });
    } else {
        alert('🎉 Gratulacje! Udało Ci się ułożyć wszystkie elementy puzzli!');
    }

    // Animacja
    document.getElementById('puzzleTitle').textContent = '🎉 Puzzle ułożone! 🎉';
    document.getElementById('puzzleTitle').style.color = '#4CAF50';
}

// Inicjalizacja aplikacji
document.addEventListener('DOMContentLoaded', function() {
    // Inicjalizacja mapy
    initMap();

    // Sprawdzenie stanu powiadomień
    checkNotificationStatus();

    // Prośba o lokalizację
    requestLocationPermission();

    // Automatyczna prośba o powiadomienia (opcjonalna - można wyłączyć)
    // requestNotificationPermission();

    // Obsługa przycisków
    document.getElementById('notificationBtn').addEventListener('click', handleNotificationButton);
    document.getElementById('myLocationBtn').addEventListener('click', showMyLocation);
    document.getElementById('downloadMapBtn').addEventListener('click', downloadMap);

    // Obsługa drag & drop na stole
    const puzzleTable = document.getElementById('puzzleTable');
    puzzleTable.addEventListener('dragover', handleDragOver);
    puzzleTable.addEventListener('drop', function(e) {
        if (e.stopPropagation) {
            e.stopPropagation();
        }
        e.preventDefault();

        const draggedPiece = document.querySelector('.puzzle-piece.dragging');
        if (draggedPiece) {
            // Nie pozwól przenieść zablokowanego elementu z powrotem na stół
            if (draggedPiece.dataset.locked === 'true') {
                return false;
            }

            const parentSlot = draggedPiece.parentElement;
            if (parentSlot.classList.contains('puzzle-slot')) {
                parentSlot.classList.remove('filled', 'correct');
                if (draggedPiece.dataset.wasCorrect === 'true') {
                    draggedPiece.dataset.wasCorrect = 'false';
                    correctPositions--;
                    updateProgress();
                }
            }
            puzzleTable.appendChild(draggedPiece);
        }

        return false;
    });
});
