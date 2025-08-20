// Este script carga un archivo JSON con subtítulos estilo SRT
// y adapta la lógica para mostrar mensajes con inicio y fin.

function abrirEnNuevaPestana(url) {
  window.open(url, '_blank');
}

// Ejemplo de uso:

let messageTimeout = null;
let fadeTimeout = null;
let messageIndex = 0;

// Convierte "HH:MM:SS,mmm" a segundos
function timeToSeconds(time) {
    const [h, m, rest] = time.split(":");
    const [s, ms] = rest.split(",");
    return (parseInt(h) * 3600) + (parseInt(m) * 60) + parseInt(s) + (parseInt(ms) / 1000);
}

// estamosactivos
function estamosactivos() {
    document.addEventListener("visibilitychange", function() {
        if (document.visibilityState === 'visible') {
            console.log("La pestaña está activa");
            // Aquí puedes agregar el código que quieres que se ejecute cuando la pestaña se activa
            // // Por ejemplo, reanudar animaciones, actualizar datos, etc.
            // resetVideoAndMessages(videoPlayer, messageContainer, dynamicMessage, window.messagesData);
            messageIndex = 0;
        }
        else {
            // La pestaña se ha vuelto inactiva (invisible)
            console.log("La pestaña está inactiva");
            // Aquí puedes agregar el código que quieres que se ejecute cuando la pestaña se inactiva
            //Por ejemplo, pausar animaciones, guardar datos, etc.    
        }
});
}

// Reinicia video y mensajes
function resetVideoAndMessages(videoPlayer, messageContainer, dynamicMessage, messagesData) {
    console.log('Reiniciando video y mensajes...');

    if (videoPlayer) {
        if (videoPlayer.tagName === 'VIDEO') {
            videoPlayer.currentTime = 0;
            const playPromise = videoPlayer.play();
            if (playPromise !== undefined) {
                playPromise.catch(error => console.warn('No se pudo reproducir el video <video>:', error));
            }
        } else if (videoPlayer.tagName === 'IFRAME') {
            const src = videoPlayer.src;
            const autoplaySrc = src.includes('?') 
                ? src.replace(/(\?.*?)?$/, '$1&autoplay=1') 
                : src + '?autoplay=1';
            videoPlayer.src = '';
            videoPlayer.src = autoplaySrc;
            console.log('Video <iframe> reiniciado con src:', autoplaySrc);
        }
    }

    messageIndex = 0;
    if (messageTimeout) clearTimeout(messageTimeout);
    if (fadeTimeout) clearTimeout(fadeTimeout);
    showNextMessage(messageContainer, dynamicMessage, messagesData, videoPlayer);
}

// Muestra los mensajes uno por uno
function showNextMessage(messageContainer, dynamicMessage, messagesData, videoPlayer) {
    if (messageTimeout) clearTimeout(messageTimeout);
    if (fadeTimeout) clearTimeout(fadeTimeout);

    if (messageIndex >= messagesData.length) {
        console.log('Índice de mensajes reiniciado a 0');
        messageIndex = 0;
    }

    const currentMessage = messagesData[messageIndex];

    if (!currentMessage || !currentMessage.message || !currentMessage.duration) {
        console.error(`Error: Mensaje en el índice ${messageIndex} no es válido.`, currentMessage);
        return;
    }

    dynamicMessage.textContent = currentMessage.message;
    dynamicMessage.style.fontSize = currentMessage.size || '16px';
    dynamicMessage.style.color = currentMessage.color || '#000000';
    dynamicMessage.style.fontFamily = currentMessage.font || 'Arial';
    messageContainer.style.opacity = 1;

    console.log(`Mostrando mensaje ${messageIndex + 1} de ${messagesData.length}: "${currentMessage.message}"`);

    if (messageIndex === messagesData.length - 1) {
        console.log('Último mensaje alcanzado, reiniciando tras duración...');
        messageTimeout = setTimeout(() => {
            resetVideoAndMessages(videoPlayer, messageContainer, dynamicMessage, messagesData);
        }, currentMessage.duration * 1000);
    } else {
        messageTimeout = setTimeout(() => {
            console.log(`Desvaneciendo mensaje ${messageIndex + 1}`);
            messageContainer.style.opacity = 0;
            messageIndex++;
            fadeTimeout = setTimeout(() => {
                showNextMessage(messageContainer, dynamicMessage, messagesData, videoPlayer);
            }, 1000);
        }, (currentMessage.duration * 1000) - 1000);
    }
}

// Cargar JSON
estamosactivos();
fetch('messages.json')
    .then(response => {
        if (!response.ok) throw new Error(`Error al cargar messages.json: ${response.status}`);
        return response.json();
    })
    .then(data => {
        const pageTitle = document.getElementById('page-title');
        const videoPlayer = document.getElementById('video-player');
        const messageContainer = document.querySelector('.message-container');
        const dynamicMessage = document.getElementById('dynamic-message');

        if (!pageTitle || !videoPlayer || !messageContainer || !dynamicMessage) {
            console.error('Error: faltan elementos en el HTML');
            return;
        }

        if (videoPlayer.tagName !== 'VIDEO' && videoPlayer.tagName !== 'IFRAME') {
            console.error('Error: El elemento con ID "video-player" no es un <video> ni un <iframe>.');
            return;
        }

        // Convertir subtítulos SRT a formato con duración
        const subtitles = data.subtitles.map(sub => {
            const startSec = timeToSeconds(sub.start);
            const endSec = timeToSeconds(sub.end);
            return {
                ...sub,
                duration: endSec - startSec 
            };
        });

        window.messagesData = subtitles;

        pageTitle.textContent = data.pageTitle;
        videoPlayer.src = data.videoUrl;

        dynamicMessage.addEventListener('click', () => {
            resetVideoAndMessages(videoPlayer, messageContainer, dynamicMessage, window.messagesData);
        });
        dynamicMessage.addEventListener('dblclick', () => {
            let enlace = "https://entrenoelalma.org/digitalers01/vintageGPT/rickrolls.html";
            abrirEnNuevaPestana(enlace);
        });


        setTimeout(() => {
            console.log('Iniciando secuencia de mensajes');
            showNextMessage(messageContainer, dynamicMessage, window.messagesData, videoPlayer);
        }, 1500);
    })
    .catch(error => console.error('Error al cargar la configuración:', error));
