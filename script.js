document.addEventListener('DOMContentLoaded', function() {
    // Elementos da página
    const toggleCameraBtn = document.getElementById('toggleCamera');
    const uploadBtn = document.getElementById('uploadBtn');
    const chooseFileBtn = document.getElementById('chooseFile');
    const addTextBtn = document.getElementById('addTextBtn');
    const cameraView = document.getElementById('cameraView');
    const imagePreview = document.getElementById('imagePreview');
    const fileInput = document.getElementById('fileInput');
    const statusDiv = document.getElementById('status');
    const placeholder = document.getElementById('placeholder');
    const progressContainer = document.getElementById('progressContainer');
    const progressBar = document.getElementById('progressBar');
    const progressText = document.getElementById('progressText');

    // Elementos dos filtros
    const filtersContainer = document.getElementById('filtersContainer');
    const filterBtns = document.querySelectorAll('.filter-btn');
    const filterIntensity = document.getElementById('filterIntensity');
    const applyFilterBtn = document.getElementById('applyFilter');
    const resetFilterBtn = document.getElementById('resetFilter');

    // Variáveis globais
    let stream = null;
    let currentImage = null;
    const scriptUrl = "https://script.google.com/macros/s/AKfycbx-PejljGT1_4h-Fs2L8qvWHH69l8oF-K2hAFfLDLl0zn7-2uFqUrZyuoz630vrhhvD/exec";
    let activeTextElement = null;
    const fonts = ['Arial', 'Courier New', 'Georgia', 'Times New Roman', 'Verdana', 'Impact'];
    let currentFontIndex = 0;
    let currentFilter = 'none';
    let currentFilterIntensity = 100;
    let isCameraActive = false;

    // Inicializar editor de texto
    const textToolbar = document.getElementById('textToolbar');
    const textInput = document.getElementById('textInput');
    const textColor = document.getElementById('textColor');
    const textSize = document.getElementById('textSize');
    const textSizeValue = document.getElementById('textSizeValue');
    const changeFont = document.getElementById('changeFont');
    const alignLeft = document.getElementById('alignLeft');
    const alignCenter = document.getElementById('alignCenter');
    const alignRight = document.getElementById('alignRight');
    const finishText = document.getElementById('finishText');
    const mediaContainer = document.querySelector('.media-container');

    // Habilitar botão de texto quando houver imagem
    function checkImageForText() {
        addTextBtn.disabled = !(imagePreview.style.display === 'block');
    }

    // Mostrar/ocultar filtros quando houver imagem
    function toggleFilters() {
        const hasImage = imagePreview.style.display === 'block';
        filtersContainer.style.display = hasImage ? 'block' : 'none';
    }

    // Observar mudanças na imagem
    const observer = new MutationObserver(function() {
        checkImageForText();
        toggleFilters();
    });
    observer.observe(imagePreview, { attributes: true, attributeFilter: ['style'] });
    observer.observe(cameraView, { attributes: true, attributeFilter: ['style'] });

    // ========== FUNCIONALIDADES DE TEXTO ==========
    // Adicionar novo texto
    addTextBtn.addEventListener('click', () => {
        addTextElement('Clique para editar');
    });

    // Criar elemento de texto
    function addTextElement(initialText) {
        const textElement = document.createElement('div');
        textElement.className = 'draggable-text text-active';
        textElement.contentEditable = true;
        textElement.textContent = initialText;
        textElement.style.color = textColor.value;
        textElement.style.fontSize = `${textSize.value}px`;
        textElement.style.fontFamily = fonts[currentFontIndex];
        
        // Posicionar no centro
        textElement.style.left = '50%';
        textElement.style.top = '50%';
        
        // Tornar arrastável
        makeDraggable(textElement);
        
        // Selecionar ao clicar
        textElement.addEventListener('click', (e) => {
            e.stopPropagation();
            selectTextElement(textElement);
        });
        
        mediaContainer.appendChild(textElement);
        selectTextElement(textElement);
        textInput.value = initialText;
        textInput.focus();
    }

    // Selecionar elemento de texto
    function selectTextElement(element) {
        if (activeTextElement) {
            activeTextElement.classList.remove('text-active');
            activeTextElement.contentEditable = false;
        }
        activeTextElement = element;
        element.classList.add('text-active');
        element.contentEditable = true;
        textToolbar.style.display = 'block';
        
        // Atualizar controles com as propriedades do texto selecionado
        textInput.value = element.textContent;
        textColor.value = rgbToHex(element.style.color) || '#000000';
        const fontSize = parseInt(element.style.fontSize);
        textSize.value = isNaN(fontSize) ? 24 : fontSize;
        textSizeValue.textContent = `${textSize.value}px`;
    }

    // Tornar elemento arrastável
    function makeDraggable(element) {
        let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
        
        element.onmousedown = dragMouseDown;
        
        function dragMouseDown(e) {
            e = e || window.event;
            e.preventDefault();
            e.stopPropagation();
            
            // Get the mouse cursor position at startup
            pos3 = e.clientX;
            pos4 = e.clientY;
            document.onmouseup = closeDragElement;
            document.onmousemove = elementDrag;
        }
        
        function elementDrag(e) {
            e = e || window.event;
            e.preventDefault();
            
            // Calculate the new cursor position
            pos1 = pos3 - e.clientX;
            pos2 = pos4 - e.clientY;
            pos3 = e.clientX;
            pos4 = e.clientY;
            
            // Set the element's new position
            const rect = mediaContainer.getBoundingClientRect();
            let newTop = (element.offsetTop - pos2) / rect.height * 100;
            let newLeft = (element.offsetLeft - pos1) / rect.width * 100;
            
            // Limit to container bounds
            newTop = Math.max(0, Math.min(100, newTop));
            newLeft = Math.max(0, Math.min(100, newLeft));
            
            element.style.top = `${newTop}%`;
            element.style.left = `${newLeft}%`;
        }
        
        function closeDragElement() {
            document.onmouseup = null;
            document.onmousemove = null;
        }
    }

    // Atualizar texto em tempo real
    textInput.addEventListener('input', () => {
        if (activeTextElement) {
            activeTextElement.textContent = textInput.value;
        }
    });

    // Atualizar cor em tempo real
    textColor.addEventListener('input', () => {
        if (activeTextElement) {
            activeTextElement.style.color = textColor.value;
        }
    });

    // Atualizar tamanho em tempo real
    textSize.addEventListener('input', () => {
        const size = textSize.value;
        textSizeValue.textContent = `${size}px`;
        if (activeTextElement) {
            activeTextElement.style.fontSize = `${size}px`;
        }
    });

    // Mudar fonte
    changeFont.addEventListener('click', () => {
        currentFontIndex = (currentFontIndex + 1) % fonts.length;
        changeFont.textContent = fonts[currentFontIndex];
        if (activeTextElement) {
            activeTextElement.style.fontFamily = fonts[currentFontIndex];
        }
    });

    // Alinhamento
    alignLeft.addEventListener('click', () => {
        if (activeTextElement) activeTextElement.style.textAlign = 'left';
    });
    alignCenter.addEventListener('click', () => {
        if (activeTextElement) activeTextElement.style.textAlign = 'center';
    });
    alignRight.addEventListener('click', () => {
        if (activeTextElement) activeTextElement.style.textAlign = 'right';
    });

    // Finalizar edição
    finishText.addEventListener('click', () => {
        if (activeTextElement) {
            activeTextElement.classList.remove('text-active');
            activeTextElement.contentEditable = false;
            activeTextElement = null;
            textToolbar.style.display = 'none';
        }
    });

    // Selecionar texto ao clicar no container
    mediaContainer.addEventListener('click', (e) => {
        if (e.target === mediaContainer) {
            if (activeTextElement) {
                activeTextElement.classList.remove('text-active');
                activeTextElement.contentEditable = false;
                activeTextElement = null;
                textToolbar.style.display = 'none';
            }
        }
    });

    // Converter RGB para HEX
    function rgbToHex(rgb) {
        if (!rgb) return '#000000';
        const match = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
        if (!match) return rgb; // Já está em formato HEX
        
        function hex(x) {
            return ("0" + parseInt(x).toString(16)).slice(-2);
        }
        return "#" + hex(match[1]) + hex(match[2]) + hex(match[3]);
    }

    // ========== FUNCIONALIDADES DE CÂMERA E IMAGEM ==========
    // Função para calcular dimensões proporcionais
    function calculateCanvasDimensions(videoWidth, videoHeight, containerWidth, containerHeight) {
        const containerRatio = containerWidth / containerHeight;
        const videoRatio = videoWidth / videoHeight;

        let canvasWidth, canvasHeight;
        if (videoRatio > containerRatio) {
            // Ajustar pela largura
            canvasWidth = containerWidth;
            canvasHeight = containerWidth / videoRatio;
        } else {
            // Ajustar pela altura
            canvasHeight = containerHeight;
            canvasWidth = containerHeight * videoRatio;
        }

        return { width: canvasWidth, height: canvasHeight };
    }

    // Botão que alterna entre abrir câmera e tirar foto
    toggleCameraBtn.addEventListener('click', async () => {
        if (!isCameraActive) {
            // Abrir câmera
            try {
                resetStatus();
                placeholder.style.display = 'none';
                imagePreview.style.display = 'none';
                
                stream = await navigator.mediaDevices.getUserMedia({ 
                    video: { 
                        facingMode: 'environment',
                        width: { ideal: 1280 },
                        height: { ideal: 720 }
                    } 
                });
                
                cameraView.srcObject = stream;
                cameraView.style.display = 'block';
                uploadBtn.disabled = true;
                addTextBtn.disabled = true;
                
                isCameraActive = true;
                toggleCameraBtn.innerHTML = '<i class="fas fa-camera-retro"></i>';
                
                showStatus("Câmera ativada. Posicione e clique em.", 'info');
            } catch (err) {
                showError("Erro ao acessar a câmera: " + err.message);
            }
        } else {
            // Tirar foto
            const containerRect = mediaContainer.getBoundingClientRect();
            const { width: canvasWidth, height: canvasHeight } = calculateCanvasDimensions(
                cameraView.videoWidth,
                cameraView.videoHeight,
                containerRect.width,
                containerRect.height
            );

            const canvas = document.createElement('canvas');
            canvas.width = canvasWidth;
            canvas.height = canvasHeight;
            const ctx = canvas.getContext('2d');

            // Calcular proporções para manter a imagem centralizada
            const videoRatio = cameraView.videoWidth / cameraView.videoHeight;
            const canvasRatio = canvasWidth / canvasHeight;
            let drawWidth, drawHeight, offsetX, offsetY;

            if (videoRatio > canvasRatio) {
                drawHeight = canvasHeight;
                drawWidth = canvasHeight * videoRatio;
                offsetX = (canvasWidth - drawWidth) / 2;
                offsetY = 0;
            } else {
                drawWidth = canvasWidth;
                drawHeight = canvasWidth / videoRatio;
                offsetX = 0;
                offsetY = (canvasHeight - drawHeight) / 2;
            }

            ctx.drawImage(cameraView, offsetX, offsetY, drawWidth, drawHeight);
            
            // Efeito de flash
            cameraView.style.transition = '0.3s';
            cameraView.style.filter = 'brightness(2)';
            setTimeout(() => {
                cameraView.style.filter = 'brightness(1)';
            }, 300);
            
            currentImage = canvas.toDataURL('image/jpeg', 0.8);
            imagePreview.src = currentImage;
            imagePreview.style.display = 'block';
            cameraView.style.display = 'none';
            
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
                stream = null;
            }
            
            isCameraActive = false;
            toggleCameraBtn.innerHTML = '<i class="fas fa-camera"></i>';
            uploadBtn.disabled = false;
            addTextBtn.disabled = false;
            
            showStatus("Foto capturada. Clique em 'Enviar para o Drive'.", 'info');
        }
    });

    // Escolher arquivo
    chooseFileBtn.addEventListener('click', () => {
        fileInput.click();
    });

    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file && file.type.match('image.*')) {
            const reader = new FileReader();
            reader.onload = (event) => {
                resetStatus();
                placeholder.style.display = 'none';
                currentImage = event.target.result;
                imagePreview.src = currentImage;
                imagePreview.style.display = 'block';
                cameraView.style.display = 'none';
                
                if (stream) {
                    stream.getTracks().forEach(track => track.stop());
                    stream = null;
                }
                
                uploadBtn.disabled = false;
                addTextBtn.disabled = false;
                
                showStatus("Imagem selecionada. Clique em 'Enviar para o Drive'.", 'info');
            };
            reader.readAsDataURL(file);
        } else {
            showError("Por favor, selecione um arquivo de imagem válido.");
        }
    });

    // ========== FUNCIONALIDADES DE FILTROS ==========
    // Selecionar filtro
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.dataset.filter;
            applyFilter();
        });
    });

    // Aplicar filtro
    function applyFilter() {
        if (!currentImage) return;
        
        const intensity = currentFilterIntensity / 100;
        let filterValue = currentFilter;
        
        if (currentFilter !== 'none') {
            filterValue = currentFilter.replace(/([\d.]+)/g, match => {
                return parseFloat(match) * intensity;
            });
        }
        
        imagePreview.style.filter = filterValue;
    }

    // Controle de intensidade
    filterIntensity.addEventListener('input', () => {
        currentFilterIntensity = filterIntensity.value;
        applyFilter();
    });

    // Botão aplicar filtro permanentemente
    applyFilterBtn.addEventListener('click', () => {
        if (!currentImage) return;
        
        const canvas = document.createElement('canvas');
        const img = new Image();
        
        img.onload = function() {
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            ctx.filter = imagePreview.style.filter || 'none';
            ctx.drawImage(img, 0, 0);
            
            currentImage = canvas.toDataURL('image/jpeg');
            imagePreview.src = currentImage;
            imagePreview.style.filter = 'none';
            currentFilter = 'none';
            filterBtns.forEach(b => b.classList.remove('active'));
            document.querySelector('.filter-btn[data-filter="none"]').classList.add('active');
            filterIntensity.value = 100;
            
            showStatus("Filtro aplicado com sucesso!", 'success');
        };
        
        img.src = currentImage;
    });

    // Botão resetar filtro
    resetFilterBtn.addEventListener('click', () => {
        imagePreview.style.filter = 'none';
        currentFilter = 'none';
        filterBtns.forEach(b => b.classList.remove('active'));
        document.querySelector('.filter-btn[data-filter="none"]').classList.add('active');
        filterIntensity.value = 100;
    });

    // ========== FUNCIONALIDADE DE UPLOAD ==========
    // Enviar para o Drive
    uploadBtn.addEventListener('click', async () => {
        if (!currentImage) {
            showError("Nenhuma imagem para enviar");
            return;
        }
        
        try {
            uploadBtn.disabled = true;
            showStatus("Enviando imagem...", 'info');
            progressContainer.style.display = 'block';
            
            // Simular progresso
            simulateUploadProgress();
            
            // Criar canvas com a imagem e textos
            const canvas = document.createElement('canvas');
            const img = new Image();
            
            await new Promise((resolve) => {
                img.onload = resolve;
                img.src = currentImage;
            });
            
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            
            // Adicionar textos ao canvas
            const textElements = document.querySelectorAll('.draggable-text');
            textElements.forEach(textElement => {
                const text = textElement.textContent;
                const color = textElement.style.color || '#000000';
                const fontSize = parseInt(textElement.style.fontSize) || 24;
                const fontFamily = textElement.style.fontFamily || 'Arial';
                const textAlign = textElement.style.textAlign || 'center';
                
                // Calcular posição baseada em porcentagem
                const left = parseFloat(textElement.style.left) || 50;
                const top = parseFloat(textElement.style.top) || 50;
                
                const x = (left / 100) * canvas.width;
                const y = (top / 100) * canvas.height;
                
                ctx.font = `${fontSize}px ${fontFamily}`;
                ctx.fillStyle = color;
                ctx.textAlign = textAlign;
                ctx.textBaseline = 'middle';
                
                // Desenhar texto
                ctx.fillText(text, x, y);
            });
            
            // Converter para base64
            const finalImage = canvas.toDataURL('image/jpeg', 0.8);
            const base64Data = finalImage.split(',')[1];
            
            // Enviar para o Google Apps Script
            const response = await fetch(scriptUrl, {
                method: 'POST',
                body: base64Data
            });
            
            const result = await response.json();
            
            if (result.success) {
                showStatus(`Imagem enviada com sucesso como ${result.fileName}!`, 'success');
                uploadBtn.disabled = true;
                currentImage = null;
                
                // Resetar após 5 segundos
                setTimeout(() => {
                    resetInterface();
                }, 5000);
            } else {
                showError("Erro ao enviar: " + (result.error || "Desconhecido"));
                uploadBtn.disabled = false;
            }
        } catch (err) {
            showError("Falha no envio: " + err.message);
            uploadBtn.disabled = false;
        } finally {
            progressContainer.style.display = 'none';
        }
    });

    // ========== FUNÇÕES AUXILIARES ==========
    function showStatus(message, type = 'info') {
        statusDiv.textContent = message;
        statusDiv.className = 'status';
        
        if (type === 'success') {
            statusDiv.classList.add('success');
        } else if (type === 'error') {
            statusDiv.classList.add('error');
        }
        
        statusDiv.style.display = 'block';
    }

    function showError(message) {
        showStatus(message, 'error');
    }

    function resetStatus() {
        statusDiv.style.display = 'none';
    }

    function resetInterface() {
        placeholder.style.display = 'flex';
        imagePreview.style.display = 'none';
        cameraView.style.display = 'none';
        resetStatus();
        uploadBtn.disabled = true;
        addTextBtn.disabled = true;
        fileInput.value = '';
        
        // Remover todos os textos
        document.querySelectorAll('.draggable-text').forEach(el => el.remove());
        textToolbar.style.display = 'none';
        
        // Resetar filtros
        imagePreview.style.filter = 'none';
        currentFilter = 'none';
        filterBtns.forEach(b => b.classList.remove('active'));
        document.querySelector('.filter-btn[data-filter="none"]').classList.add('active');
        filterIntensity.value = 100;
        
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            stream = null;
        }
        
        // Resetar botão da câmera
        isCameraActive = false;
        toggleCameraBtn.innerHTML = '<i class="fas fa-camera"></i>';
    }

    function simulateUploadProgress() {
        let progress = 0;
        const interval = setInterval(() => {
            progress += Math.random() * 10;
            if (progress >= 100) {
                progress = 100;
                clearInterval(interval);
            }
            updateProgress(progress);
        }, 300);
    }

    function updateProgress(percent) {
        progressBar.style.width = `${percent}%`;
        progressText.textContent = `${Math.round(percent)}%`;
    }
    
    // Inicializar - desabilitar o botão de texto no carregamento
    addTextBtn.disabled = true;
});