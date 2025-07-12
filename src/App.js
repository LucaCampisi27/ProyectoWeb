import React, { useState, useRef, useEffect } from 'react'; // Importa useRef y useEffect
// IMPORTANTE: Asegúrate de que estos archivos de imagen (CEA.png y CEAFONDO.png)
// existan en tu carpeta 'src/assets/' y que los nombres (incluyendo mayúsculas/minúsculas)
// coincidan exactamente con los nombres de los archivos en tu sistema.
import logoCamion from './assets/CEA.png';
import fondoLogistica from './assets/CEAFONDO.png';
// aboutUsImage ya no se importa ya que se usa logoCamion directamente en JSX

// Importaciones de Font Awesome
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faTruck,
  faWarehouse,
  faBoxOpen, // Para "Package"
  faPhone,
  faEnvelope, // Para "Mail"
  faMapPin,
  faBars, // Para "Menu"
  faTimes, // Para "X"
  faCommentAlt, // Para "MessageSquare"
  faFileAlt // Para "FileText"
} from '@fortawesome/free-solid-svg-icons';
import { faFacebookF, faWhatsapp } from '@fortawesome/free-brands-svg-icons'; // Asegúrate de que esta importación sea correcta

// El componente Icon ya no es necesario, ya que usamos FontAwesomeIcon directamente.
// Se ha eliminado para simplificar el código.


// Componente principal de la aplicación
const App = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [userMessage, setUserMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Estados para el Generador de Descripción de Carga
  const [cargoDetails, setCargoDetails] = useState('');
  const [generatedDescription, setGeneratedDescription] = useState('');
  const [isGeneratingDescription, setIsGeneratingDescription] = useState(false);

  // Ref para el textarea oculto que se usará para copiar al portapapeles
  const textareaRef = useRef(null);
  // Nueva ref para el contenedor de mensajes del chatbot
  const chatbotMessagesRef = useRef(null);

  // Efecto para hacer scroll al final del chat cuando se actualiza el historial
  useEffect(() => {
    if (chatbotMessagesRef.current) {
      chatbotMessagesRef.current.scrollTop = chatbotMessagesRef.current.scrollHeight;
    }
  }, [chatHistory]);

  // Función para manejar el scroll suave
  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setIsMenuOpen(false); // Cierra el menú móvil después de hacer clic
    }
  };

  // Función para obtener la clave API (específica para Create React App)
  const getApiKey = () => {
    // Para proyectos de Create React App, las variables de entorno deben comenzar con REACT_APP_
    const apiKey = process.env.REACT_APP_GEMINI_API_KEY;

    // --- INICIO DE DEPURACIÓN ---
    console.log("Valor de apiKey antes de la llamada a Gemini (getApiKey):", apiKey);
    if (!apiKey) {
      console.error("Error: REACT_APP_GEMINI_API_KEY no está definida en el entorno del navegador. Asegúrate de que esté configurada en tu archivo .env o .env.local y que el nombre sea correcto.");
    } else {
      console.log("API Key (REACT_APP_GEMINI_API_KEY) encontrada.");
    }
    // --- FIN DE DEPURACIÓN ---
    return apiKey;
  };


  // Función para enviar mensajes al chatbot (API de Gemini)
  const sendMessageToChatbot = async () => {
    if (!userMessage.trim()) return;

    // Asignar un ID único a cada mensaje para una mejor reconciliación de React
    const newUserMessage = { id: Date.now(), role: 'user', parts: [{ text: userMessage }] };
    const updatedChatHistory = [...chatHistory, newUserMessage];
    setChatHistory(updatedChatHistory);
    setUserMessage('');
    setIsLoading(true);

    try {
      const apiKey = getApiKey();

      if (!apiKey) {
        setChatHistory(prevHistory => [...prevHistory, { id: Date.now(), role: 'model', parts: [{ text: 'Error: La clave de la API no está configurada. Revisa la consola para más detalles.' }] }]);
        setIsLoading(false);
        return;
      }

      // Crear un payload para la API que no incluya el campo 'id'
      // Esto es crucial para resolver el error "Unknown name \"id\""
      const apiPayloadContents = updatedChatHistory.map(({ id, ...rest }) => rest);
      const payload = { contents: apiPayloadContents };

      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

      // --- INICIO DE DEPURACIÓN ADICIONAL ---
      console.log("DEBUG: Enviando solicitud al chatbot de Gemini API:");
      console.log("DEBUG: URL:", apiUrl);
      console.log("DEBUG: Payload (para API):", JSON.stringify(payload, null, 2)); // Imprime el payload formateado
      // --- FIN DE DEPURACIÓN ADICIONAL ---

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      // --- INICIO DE DEPURACIÓN ---
      if (!response.ok) {
        const errorBody = await response.text(); // Intenta leer el cuerpo del error
        console.error(`Error HTTP (chatbot): ${response.status} ${response.statusText} - Cuerpo:`, errorBody);
        setChatHistory(prevHistory => [...prevHistory, { id: Date.now(), role: 'model', parts: [{ text: `Error de la API: ${response.status}. Revisa la consola para más detalles.` }] }]);
        setIsLoading(false);
        return;
      }
      // --- FIN DE DEPURACIÓN ---

      const result = await response.json();

      if (result.candidates && result.candidates.length > 0 &&
          result.candidates[0].content && result.candidates[0].content.parts &&
          result.candidates[0].content.parts.length > 0) {
        const botResponseText = result.candidates[0].content.parts[0].text;
        // Asignar un ID único al mensaje del bot también
        setChatHistory(prevHistory => [...prevHistory, { id: Date.now() + 1, role: 'model', parts: [{ text: botResponseText }] }]);
      } else {
        // --- INICIO DE DEPURACIÓN ---
        console.error("Estructura de respuesta inesperada de la API de Gemini (chatbot):", result);
        // --- FIN DE DEPURACIÓN ---
        setChatHistory(prevHistory => [...prevHistory, { id: Date.now(), role: 'model', parts: [{ text: 'Lo siento, no pude generar una respuesta. Intenta de nuevo.' }] }]);
      }
    } catch (error) {
      console.error('Error al comunicarse con el chatbot:', error);
      setChatHistory(prevHistory => [...prevHistory, { id: Date.now(), role: 'model', parts: [{ text: 'Hubo un error al conectar con el servicio. Por favor, inténtalo más tarde.' }] }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Función para generar la descripción de carga (API de Gemini)
  const generateCargoDescription = async () => {
    if (!cargoDetails.trim()) {
      setGeneratedDescription('Por favor, ingresa algunos detalles sobre la carga.');
      return;
    }

    setIsGeneratingDescription(true);
    setGeneratedDescription(''); // Limpiar la descripción anterior

    // Prompt simplificado para obtener una descripción en lenguaje natural con valor aproximado
    const prompt = `Genera una descripción profesional y concisa para una publicación de carga de logística, basándote en los siguientes detalles: "${cargoDetails}". Incluye información relevante para transportistas como tipo de carga, volumen/peso estimado, origen, destino, cualquier requisito especial y un valor aproximado en USD para esta carga.`;

    // Payload simplificado sin responseMimeType y responseSchema
    const payload = {
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    };

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${getApiKey()}`;

    // --- INICIO DE DEPURACIÓN ADICIONAL ---
    console.log("DEBUG: Enviando solicitud al generador de carga de Gemini API:");
    console.log("DEBUG: URL:", apiUrl);
    console.log("DEBUG: Payload:", JSON.stringify(payload, null, 2)); // Imprime el payload formateado
    // --- FIN DE DEPURACIÓN ADICIONAL ---

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      // --- INICIO DE DEPURACIÓN ---
      if (!response.ok) {
        const errorBody = await response.text(); // Intenta leer el cuerpo del error
        console.error(`Error HTTP (generador de carga): ${response.status} ${response.statusText} - Cuerpo:`, errorBody);
        setGeneratedDescription(`Error de la API: ${response.status}. Revisa la consola para más detalles.`);
        setIsGeneratingDescription(false);
        return;
      }
      // --- FIN DE DEPURACIÓN ---

      const result = await response.json();

      if (result.candidates && result.candidates.length > 0 &&
          result.candidates[0].content && result.candidates[0].content.parts &&
          result.candidates[0].content.parts.length > 0) {
        setGeneratedDescription(result.candidates[0].content.parts[0].text);
      } else {
        // --- INICIO DE DEPURACIÓN ---
        console.error("Estructura de respuesta inesperada de la API de Gemini (generador de carga):", result);
        // --- FIN DE DEPURACIÓN ---
        setGeneratedDescription('No se pudo generar la descripción. Intenta con más detalles.');
      }
    } catch (error) {
      console.error('Error al generar la descripción de carga:', error);
      setGeneratedDescription('Hubo un error al generar la descripción. Por favor, inténtalo más tarde.');
    } finally {
      setIsGeneratingDescription(false);
    }
  };

  return (
    <div className="app-container">
      {/* Header */}
      <header className="header">
        <nav className="navbar">
          {/* Logo con imagen local */}
          <div className="logo-container">
            <img src={logoCamion} alt="Logo CEA" className="logo-icon" /> {/* Usamos la imagen importada */}
            <span className="logo-text">CEA</span>
          </div>

          {/* Navegación de escritorio */}
          <ul className="nav-links-desktop">
            <li><button onClick={() => scrollToSection('home')} className="nav-button">Inicio</button></li>
            <li><button onClick={() => scrollToSection('services')} className="nav-button">Servicios</button></li>
            <li><button onClick={() => scrollToSection('about')} className="nav-button">Nosotros</button></li>
            <li><button onClick={() => scrollToSection('contact')} className="nav-button">Contacto</button></li>
          </ul>

          {/* Botón de menú móvil */}
          <div className="menu-button-mobile">
            <button onClick={() => setIsMenuOpen(!isMenuOpen)}>
              {isMenuOpen ? <FontAwesomeIcon icon={faTimes} className="menu-icon" /> : <FontAwesomeIcon icon={faBars} className="menu-icon" />}
            </button>
          </div>
        </nav>

        {/* Menú móvil */}
        {isMenuOpen && (
          <div className="mobile-menu">
            <ul className="mobile-nav-links">
              <li><button onClick={() => scrollToSection('home')} className="mobile-nav-button">Inicio</button></li>
              <li><button onClick={() => scrollToSection('services')} className="mobile-nav-button">Servicios</button></li>
              <li><button onClick={() => scrollToSection('about')} className="mobile-nav-button">Nosotros</button></li>
              <li><button onClick={() => scrollToSection('contact')} className="mobile-nav-button">Contacto</button></li>
            </ul>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section
        id="home"
        className="hero-section"
        style={{
          backgroundImage: `url(${fondoLogistica})`, // Usamos la imagen importada
        }}
      >
        <div className="hero-overlay"></div>
        <div className="hero-content">
          <h1 className="hero-title">
            CEA: Conectando Empresas y Transportistas
          </h1>
          <p className="hero-subtitle">
            Facilitamos acuerdos de viaje eficientes y seguros para tu carga, optimizando cada conexión.
          </p>
          <button
            onClick={() => scrollToSection('services')}
            className="hero-button"
          >
            Descubre Cómo lo Hacemos
          </button>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="services-section">
        <div className="container">
          <h2 className="section-title">Nuestros Servicios de Conexión</h2>
          <div className="services-grid">
            {/* Servicio 1: Conexión de Carga y Transporte */}
            <div className="service-card">
              <FontAwesomeIcon icon={faTruck} className="service-icon" />
              <h3 className="service-card-title">Conexión de Carga y Transporte</h3>
              <p className="service-card-description">
                Conectamos eficientemente a empresas que necesitan enviar mercancías con transportistas verificados, asegurando la mejor opción para cada viaje.
              </p>
            </div>
            {/* Servicio 2: Gestión de Acuerdos */}
            <div className="service-card">
              <FontAwesomeIcon icon={faWarehouse} className="service-icon" />
              <h3 className="service-card-title">Gestión de Acuerdos</h3>
              <p className="service-card-description">
                Facilitamos la formalización y el seguimiento de los acuerdos de viaje, brindando seguridad y transparencia en cada transacción.
              </p>
            </div>
            {/* Servicio 3: Seguimiento y Visibilidad */}
            <div className="service-card">
              <FontAwesomeIcon icon={faBoxOpen} className="service-icon" />
              <h3 className="service-card-title">Seguimiento y Visibilidad</h3>
              <p className="service-card-description">
                Ofrecemos una plataforma para el seguimiento en tiempo real de los envíos, brindando total visibilidad desde el origen hasta el destino.
              </p>
            </div>
            {/* Servicio 4: Asesoramiento Logístico Personalizado */}
            <div className="service-card">
              <FontAwesomeIcon icon={faBoxOpen} className="service-icon" />
              <h3 className="service-card-title">Asesoramiento Logístico Personalizado</h3>
              <p className="service-card-description">
                Brindamos consultoría experta para resolver desafíos logísticos y optimizar la cadena de intermediación entre empresas y transportistas.
              </p>
            </div>
            {/* Servicio 5: Soporte 24/7 */}
            <div className="service-card">
              <FontAwesomeIcon icon={faPhone} className="service-icon" />
              <h3 className="service-card-title">Soporte 24/7</h3>
              <p className="service-card-description">
                Nuestro equipo está disponible 24/7 para ofrecer asistencia y resolver cualquier incidencia durante el proceso de conexión y transporte.
              </p>
            </div>
            {/* Servicio 6: Red de Transportistas Confiables */}
            <div className="service-card">
              <FontAwesomeIcon icon={faTruck} className="service-icon" />
              <h3 className="service-card-title">Red de Transportistas Confiables</h3>
              <p className="service-card-description">
                Acceda a nuestra amplia red de transportistas calificados y con experiencia, garantizando la seguridad y fiabilidad en cada envío.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* About Us Section */}
      <section id="about" className="about-section">
        <div className="container">
          <div className="about-content">
            <div className="about-text">
              <h2 className="section-title-light">Acerca de CEA</h2>
              <p className="about-description">
                En CEA, somos una empresa innovadora dedicada a simplificar la logística, conectando de manera eficiente a empresas con necesidades de transporte y a transportistas con oportunidades de carga. Nuestra misión es crear un ecosistema logístico más fluido y accesible para todos.
              </p>
              <p className="about-description">
                Con años de experiencia en el sector, hemos desarrollado una plataforma robusta y un equipo de expertos comprometidos con la excelencia. Nos enorgullece ser el puente que une la demanda y la oferta en el mundo del transporte de carga, impulsando la eficiencia y el crecimiento de nuestros clientes y socios.
              </p>
            </div>
            <div className="about-image-container">
              <img
                src={logoCamion} // Usamos la imagen del logo para esta sección
                alt="Imagen de logística de CEA"
                className="about-image"
                onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/600x400/ADD8E6/000000?text=Imagen+No+Disponible'; }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="contact-section">
        <div className="container">
          <h2 className="section-title">Contáctanos</h2>
          <div className="contact-grid">
            {/* Información de Contacto */}
            <div className="contact-info-card">
              <h3 className="card-title">Información</h3>
              <div className="contact-details">
                <p className="contact-item">
                  <FontAwesomeIcon icon={faMapPin} className="contact-icon" />
                  Lules, Tucumán, Argentina
                </p>
                <p className="contact-item">
                  <FontAwesomeIcon icon={faPhone} className="contact-icon" />
                  381303866
                </p>
                <p className="contact-item">
                  <FontAwesomeIcon icon={faEnvelope} className="contact-icon" />
                  info@cea-logistica.com
                </p>
              </div>
            </div>

            {/* Formulario de Contacto */}
            <div className="contact-form-card">
              <h3 className="card-title">Envíanos un Mensaje</h3>
              <form className="contact-form">
                {/* NOTA IMPORTANTE: El envío de correos electrónicos directamente desde el lado del cliente (frontend)
                    no es seguro ni confiable. Para que este formulario envíe correos electrónicos,
                    necesitarías un servicio de backend (como un servidor Node.js, Python, PHP, etc.)
                    o un servicio de terceros (como Formspree, Netlify Forms, EmailJS, SendGrid, etc.)
                    que maneje la lógica de envío del correo electrónico de forma segura.
                    Este formulario es solo una demostración de la interfaz de usuario.
                */}
                <div className="form-group">
                  <label htmlFor="name" className="form-label">Nombre Completo</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    className="form-input"
                    placeholder="Tu Nombre"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="email" className="form-label">Correo Electrónico</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    className="form-input"
                    placeholder="tu.email@ejemplo.com"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="message" className="form-label">Mensaje</label>
                  <textarea
                    id="message"
                    name="message"
                    rows="5"
                    className="form-textarea"
                    placeholder="Escribe tu mensaje aquí..."
                  ></textarea>
                </div>
                <button
                  type="submit"
                  className="submit-button"
                >
                  Enviar Mensaje
                </button>
              </form>
            </div>
          </div>

          {/* Generador de Descripción de Carga (Nueva Sección LLM) */}
          <div className="cargo-generator-card">
            <h3 className="card-title-center">
              <FontAwesomeIcon icon={faFileAlt} className="cargo-generator-icon" />
              ✨ Generador de Descripción de Carga
            </h3>
            <p className="cargo-generator-description">
              Ingresa los detalles básicos de tu carga (tipo, peso, dimensiones, origen, destino, requisitos especiales) y nuestro asistente de IA generará una descripción profesional para ti.
            </p>
            <div className="cargo-generator-form">
              <div className="form-group">
                <label htmlFor="cargoDetails" className="form-label">Detalles de la Carga</label>
                <textarea
                  id="cargoDetails"
                  rows="4"
                  className="form-textarea"
                  placeholder="Ej: Carga: 20 palets de productos electrónicos, Peso: 5 toneladas, Dimensiones: 2x1x1.5m por palet. Origen: Buenos Aires, Argentina. Destino: Santiago, Chile. Requisitos: Refrigeración."
                  value={cargoDetails}
                  onChange={(e) => setCargoDetails(e.target.value)}
                  disabled={isGeneratingDescription}
                ></textarea>
              </div>
              <button
                onClick={generateCargoDescription}
                className="generate-button"
                disabled={isGeneratingDescription}
              >
                {isGeneratingDescription ? (
                  <>
                    <svg className="spinner" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Generando...
                  </>
                ) : (
                  'Generar Descripción ✨'
                )}
              </button>
              {generatedDescription && (
                <div className="generated-description-box">
                  <h4 className="generated-description-title">Descripción Generada:</h4>
                  {/* Muestra la descripción como texto plano */}
                  <p className="generated-description-text" style={{ whiteSpace: 'pre-wrap' }}>
                    {generatedDescription}
                  </p>
                  <button
                    onClick={() => {
                      if (textareaRef.current) {
                        textareaRef.current.value = generatedDescription; // Copia el texto tal cual
                        textareaRef.current.select();
                        try {
                          document.execCommand('copy');
                        } catch (err) {
                          console.error('Error al copiar al portapapeles:', err);
                        } finally {
                          window.getSelection().removeAllRanges();
                        }
                      } else {
                        console.error('El textarea de copia no está disponible.');
                      }
                    }}
                    className="copy-button"
                  >
                    Copiar al Portapapeles
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container footer-content">
          <div className="logo-container-footer">
            <img src={logoCamion} alt="Logo CEA" className="logo-icon-footer" /> {/* Usamos la misma imagen importada */}
            <span className="logo-text">CEA</span>
          </div>
          <ul className="footer-links">
            <li><button className="footer-link" onClick={() => console.log("Navegar a Privacidad")}>Privacidad</button></li>
            <li><button className="footer-link" onClick={() => console.log("Navegar a Términos")}>Términos</button></li>
            <li><button className="footer-link" onClick={() => console.log("Navegar a Mapa del sitio")}>Mapa del sitio</button></li>
          </ul>

          <div className="social-icons">
            {/* Icono de Facebook */}
            <button
              className="social-icon-link"
              onClick={() => window.open("https://www.facebook.com/luckita.campisi/", "_blank")}
            >
              <FontAwesomeIcon icon={faFacebookF} size="2x" />
            </button>

            {/* Icono de WhatsApp */}
            <button
              className="social-icon-link"
              onClick={() => window.open("https://wa.me/5493813013866", "_blank")}
            >
              <FontAwesomeIcon icon={faWhatsapp} size="2x" />
            </button>
          </div>

          <p className="copyright-text">
            &copy; {new Date().getFullYear()} CEA Logística. Todos los derechos reservados.
          </p>
        </div>
      </footer>

      {/* Botón flotante del Chatbot */}
      <button
        onClick={() => setIsChatbotOpen(!isChatbotOpen)}
        className="chatbot-toggle-button"
        aria-label="Abrir Chatbot"
      >
        <FontAwesomeIcon icon={faCommentAlt} className="chatbot-icon" /> {/* Usando FontAwesomeIcon directamente */}
      </button>

      {/* Ventana del Chatbot */}
      {isChatbotOpen && (
        <div className="chatbot-window">
          <div className="chatbot-header">
            <h3 className="chatbot-title">Asistente Virtual CEA</h3>
            <button onClick={() => setIsChatbotOpen(false)} className="chatbot-close-button">
              <FontAwesomeIcon icon={faTimes} className="chatbot-close-icon" /> {/* Usando FontAwesomeIcon directamente */}
            </button>
          </div>
          <div ref={chatbotMessagesRef} className="chatbot-messages"> {/* Aplica la ref aquí */}
            {chatHistory.length === 0 ? (
              <div className="chatbot-initial-message">
                ¡Hola! ¿En qué puedo ayudarte hoy?
              </div>
            ) : (
              chatHistory.map((msg) => (
                <div key={msg.id} className={`message-container ${msg.role === 'user' ? 'user-message-container' : 'bot-message-container'}`}>
                  <span className={`message-bubble ${msg.role === 'user' ? 'user-message-bubble' : 'bot-message-bubble'}`}>
                    {msg.parts[0].text}
                  </span>
                </div>
              ))
            )}
            {isLoading && (
              <div className="chatbot-typing-indicator">
                Escribiendo...
              </div>
            )}
          </div>
          <div className="chatbot-input-area">
            <input
              type="text"
              className="chatbot-input"
              placeholder="Escribe tu mensaje..."
              value={userMessage}
              onChange={(e) => setUserMessage(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !isLoading) {
                  sendMessageToChatbot();
                }
              }}
              disabled={isLoading}
            />
            <button
              onClick={sendMessageToChatbot}
              className="chatbot-send-button"
              disabled={isLoading}
            >
              Enviar
            </button>
          </div>
        </div>
      )}

      {/* Textarea oculto para la función de copiar al portapapeles */}
      <textarea
        ref={textareaRef}
        style={{
          position: 'absolute',
          left: '-9999px',
          top: '-9999px',
          opacity: 0,
          pointerEvents: 'none',
        }}
        readOnly
      />
      {/* Estilos CSS */}
      <style>
        {`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&display=swap');

:root {
  --primary-color: #0056b3; /* Azul oscuro */
  --secondary-color: #007bff; /* Azul vibrante */
  --accent-color: #28a745; /* Verde para acentos/éxito */
  --text-color: #333;
  --light-text-color: #f8f9fa;
  --background-light: #f4f7f6;
  --background-dark: #2c3e50; /* Azul oscuro para secciones */
  --card-background: #ffffff;
  --border-color: #dee2e6;
  --hover-color: #004085;
  --shadow-light: rgba(0, 0, 0, 0.1);
  --shadow-medium: rgba(0, 0, 0, 0.2);
  --shadow-strong: rgba(0, 0, 0, 0.3);
}

body {
  font-family: 'Inter', sans-serif;
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  background-color: var(--background-light);
  color: var(--text-color);
  line-height: 1.6;
}

.app-container {
  overflow-x: hidden; /* Evita el scroll horizontal */
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

/* Header & Navbar */
.header {
  background-color: var(--background-dark);
  color: var(--light-text-color);
  padding: 15px 0;
  position: sticky;
  top: 0;
  z-index: 1000;
  box-shadow: 0 2px 10px var(--shadow-medium);
  border-bottom-left-radius: 12px; /* Rounded corners */
  border-bottom-right-radius: 12px; /* Rounded corners */
}

.navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
}

.logo-container {
  display: flex;
  align-items: center;
}

.logo-icon {
  height: 50px; /* Ajusta el tamaño del logo */
  width: auto;
  margin-right: 10px;
  border-radius: 8px; /* Bordes redondeados para el logo */
}

.logo-text {
  font-size: 28px;
  font-weight: 700;
  color: var(--light-text-color);
}

.nav-links-desktop {
  display: flex;
  list-style: none;
  margin: 0;
  padding: 0;
}

.nav-links-desktop li {
  margin-left: 30px;
}

.nav-button {
  background: none;
  border: none;
  color: var(--light-text-color);
  font-size: 18px;
  font-weight: 600;
  cursor: pointer;
  padding: 8px 15px;
  border-radius: 8px;
  transition: background-color 0.3s ease, color 0.3s ease;
}

.nav-button:hover {
  background-color: var(--hover-color);
  color: #ffffff;
}

.menu-button-mobile {
  display: none; /* Oculto por defecto en escritorio */
}

.menu-button-mobile button {
  background: none;
  border: none;
  color: var(--light-text-color);
  font-size: 28px;
  cursor: pointer;
  padding: 5px 10px;
  border-radius: 8px;
}

.menu-icon {
  color: var(--light-text-color);
  font-size: 28px;
}

/* Mobile Menu */
.mobile-menu {
  background-color: var(--background-dark);
  padding: 20px;
  text-align: center;
  box-shadow: 0 2px 10px var(--shadow-medium);
  position: absolute;
  width: 100%;
  left: 0;
  top: 80px; /* Ajusta según la altura de tu header */
  z-index: 999;
  animation: slideDown 0.3s ease-out forwards;
  border-bottom-left-radius: 12px; /* Rounded corners */
  border-bottom-right-radius: 12px; /* Rounded corners */
}

.mobile-nav-links {
  list-style: none;
  padding: 0;
  margin: 0;
}

.mobile-nav-links li {
  margin-bottom: 15px;
}

.mobile-nav-button {
  background: none;
  border: none;
  color: var(--light-text-color);
  font-size: 20px;
  font-weight: 600;
  cursor: pointer;
  padding: 10px 20px;
  border-radius: 8px;
  transition: background-color 0.3s ease, color 0.3s ease;
  width: 100%;
}

.mobile-nav-button:hover {
  background-color: var(--hover-color);
  color: #ffffff;
}

@keyframes slideDown {
  from {
    transform: translateY(-100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

/* Hero Section */
.hero-section {
  position: relative;
  height: 600px; /* Altura fija para el hero */
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  color: var(--light-text-color);
  background-size: cover;
  background-position: center;
  background-attachment: fixed; /* Efecto parallax */
  border-bottom-left-radius: 12px; /* Rounded corners */
  border-bottom-right-radius: 12px; /* Rounded corners */
}

.hero-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5); /* Oscurece la imagen de fondo */
  border-bottom-left-radius: 12px; /* Rounded corners */
  border-bottom-right-radius: 12px; /* Rounded corners */
}

.hero-content {
  position: relative;
  z-index: 1;
  max-width: 800px;
  padding: 20px;
}

.hero-title {
  font-size: 48px;
  font-weight: 700;
  margin-bottom: 20px;
  line-height: 1.2;
  text-shadow: 2px 2px 4px var(--shadow-medium);
  animation: fadeInDown 1s ease-out forwards;
}

.hero-subtitle {
  font-size: 22px;
  margin-bottom: 30px;
  opacity: 0.9;
  animation: fadeInUp 1s ease-out forwards;
  animation-delay: 0.5s;
  animation-fill-mode: forwards;
}

.hero-button {
  background-color: var(--accent-color);
  color: #ffffff;
  font-size: 20px;
  font-weight: 600;
  padding: 15px 30px;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: background-color 0.3s ease, transform 0.2s ease;
  box-shadow: 0 4px 8px var(--shadow-medium);
  animation: fadeInUp 1s ease-out forwards;
  animation-delay: 1s;
  animation-fill-mode: forwards;
}

.hero-button:hover {
  background-color: #218838;
  transform: translateY(-3px);
}

/* Animations */
@keyframes fadeInDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Section Common Styles */
.section-title {
  font-size: 38px;
  font-weight: 700;
  text-align: center;
  margin-bottom: 50px;
  color: var(--primary-color);
  position: relative;
  padding-bottom: 10px;
}

.section-title::after {
  content: '';
  position: absolute;
  left: 50%;
  bottom: 0;
  transform: translateX(-50%);
  width: 80px;
  height: 4px;
  background-color: var(--secondary-color);
  border-radius: 2px;
}

.section-title-light {
  font-size: 38px;
  font-weight: 700;
  margin-bottom: 30px;
  color: var(--light-text-color);
  position: relative;
  padding-bottom: 10px;
}

.section-title-light::after {
  content: '';
  position: absolute;
  left: 0;
  bottom: 0;
  width: 80px;
  height: 4px;
  background-color: var(--secondary-color);
  border-radius: 2px;
}

/* Services Section */
.services-section {
  padding: 80px 0;
  background-color: var(--background-light);
}

.services-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 30px;
}

.service-card {
  background-color: var(--card-background);
  border-radius: 12px;
  padding: 30px;
  text-align: center;
  box-shadow: 0 4px 15px var(--shadow-light);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  border: 1px solid var(--border-color);
}

.service-card:hover {
  transform: translateY(-10px);
  box-shadow: 0 8px 20px var(--shadow-medium);
}

.service-icon {
  font-size: 50px;
  color: var(--secondary-color);
  margin-bottom: 20px;
}

.service-card-title {
  font-size: 24px;
  font-weight: 600;
  color: var(--primary-color);
  margin-bottom: 15px;
}

.service-card-description {
  font-size: 16px;
  color: var(--text-color);
  flex-grow: 1; /* Permite que la descripción ocupe el espacio restante */
}

/* About Us Section */
.about-section {
  padding: 80px 0;
  background-color: var(--background-dark);
  color: var(--light-text-color);
  border-top-left-radius: 12px; /* Rounded corners */
  border-top-right-radius: 12px; /* Rounded corners */
}

.about-content {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 50px;
}

.about-text {
  flex: 1;
}

.about-description {
  font-size: 18px;
  margin-bottom: 20px;
  line-height: 1.8;
  opacity: 0.9;
}

.about-image-container {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  min-width: 300px; /* Asegura un tamaño mínimo para la imagen */
}

.about-image {
  max-width: 100%;
  height: auto;
  border-radius: 12px;
  box-shadow: 0 8px 20px var(--shadow-strong);
}

/* Contact Section */
.contact-section {
  padding: 80px 0;
  background-color: var(--background-light);
}

.contact-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 40px;
  margin-bottom: 60px;
}

.contact-info-card,
.contact-form-card {
  background-color: var(--card-background);
  border-radius: 12px;
  padding: 40px;
  box-shadow: 0 4px 15px var(--shadow-light);
  border: 1px solid var(--border-color);
}

.card-title {
  font-size: 28px;
  font-weight: 700;
  color: var(--primary-color);
  margin-bottom: 30px;
  text-align: center;
}

.contact-details .contact-item {
  display: flex;
  align-items: center;
  font-size: 18px;
  margin-bottom: 15px;
  color: var(--text-color);
}

.contact-details .contact-item:last-child {
  margin-bottom: 0;
}

.contact-details .contact-icon {
  font-size: 24px;
  color: var(--secondary-color);
  margin-right: 15px;
  width: 24px; /* Asegura ancho fijo para alineación */
  text-align: center;
}

.contact-form .form-group {
  margin-bottom: 20px;
}

.form-label {
  display: block;
  font-size: 16px;
  font-weight: 600;
  color: var(--primary-color);
  margin-bottom: 8px;
}

.form-input,
.form-textarea {
  width: calc(100% - 20px); /* Ajusta padding */
  padding: 12px 10px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  font-size: 16px;
  color: var(--text-color);
  background-color: #fdfdfd;
  transition: border-color 0.3s ease, box-shadow 0.3s ease;
}

.form-input:focus,
.form-textarea:focus {
  border-color: var(--secondary-color);
  box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.25);
  outline: none;
}

.form-textarea {
  resize: vertical;
  min-height: 100px;
}

.submit-button {
  background-color: var(--primary-color);
  color: #ffffff;
  font-size: 18px;
  font-weight: 600;
  padding: 12px 25px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.3s ease, transform 0.2s ease;
  width: 100%;
  box-shadow: 0 4px 8px var(--shadow-light);
}

.submit-button:hover {
  background-color: var(--hover-color);
  transform: translateY(-2px);
}

/* Cargo Generator Section */
.cargo-generator-card {
  background-color: var(--card-background);
  border-radius: 12px;
  padding: 40px;
  box-shadow: 0 4px 15px var(--shadow-light);
  margin-top: 40px;
  border: 1px solid var(--border-color);
}

.card-title-center {
  font-size: 28px;
  font-weight: 700;
  color: var(--primary-color);
  margin-bottom: 20px;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.cargo-generator-icon {
  font-size: 32px;
  color: var(--accent-color);
}

.cargo-generator-description {
  font-size: 16px;
  color: var(--text-color);
  text-align: center;
  margin-bottom: 30px;
  max-width: 700px;
  margin-left: auto;
  margin-right: auto;
}

.generate-button {
  background-color: var(--accent-color);
  color: #ffffff;
  font-size: 18px;
  font-weight: 600;
  padding: 12px 25px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.3s ease, transform 0.2s ease;
  width: 100%;
  box-shadow: 0 4px 8px var(--shadow-light);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.generate-button:hover:not(:disabled) {
  background-color: #218838;
  transform: translateY(-2px);
}

.generate-button:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
  box-shadow: none;
}

.spinner {
  animation: spin 1s linear infinite;
  width: 20px;
  height: 20px;
  color: #fff;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.generated-description-box {
  background-color: #e9f7ef; /* Fondo suave para la descripción generada */
  border: 1px solid #d4edda;
  border-radius: 8px;
  padding: 20px;
  margin-top: 30px;
  word-wrap: break-word; /* Asegura que el texto largo se ajuste */
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.generated-description-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--accent-color);
  margin-top: 0;
  margin-bottom: 10px;
}

.generated-description-text {
  font-size: 16px;
  color: var(--text-color);
  white-space: pre-wrap; /* Preserva saltos de línea y espacios */
  margin-bottom: 15px;
}

.copy-button {
  background-color: var(--secondary-color);
  color: #ffffff;
  font-size: 16px;
  padding: 8px 15px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.copy-button:hover {
  background-color: var(--hover-color);
}

/* Footer */
.footer {
  background-color: var(--background-dark);
  color: var(--light-text-color);
  padding: 40px 0 20px;
  text-align: center;
  border-top-left-radius: 12px; /* Rounded corners */
  border-top-right-radius: 12px; /* Rounded corners */
}

.footer-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.logo-container-footer {
  margin-bottom: 15px;
}

.logo-icon-footer {
  height: 60px; /* Ajusta el tamaño del logo en el footer */
  width: auto;
  border-radius: 8px;
}

.footer-links {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  gap: 25px;
  flex-wrap: wrap;
  justify-content: center;
}

.footer-link {
  background: none;
  border: none;
  color: var(--light-text-color);
  text-decoration: none;
  font-size: 16px;
  transition: color 0.3s ease;
  cursor: pointer;
}

.footer-link:hover {
  color: var(--secondary-color);
}

.social-icons {
  display: flex;
  gap: 20px;
  margin-top: 20px;
}

.social-icon-link {
  background: none;
  border: none;
  color: var(--light-text-color);
  font-size: 28px; /* Ajusta el tamaño del icono de Font Awesome */
  cursor: pointer;
  transition: color 0.3s ease, transform 0.2s ease;
  padding: 0; /* Elimina padding extra si lo tiene */
  display: flex; /* Para centrar el icono si el botón es más grande */
  align-items: center;
  justify-content: center;
}

.social-icon-link:hover {
  color: var(--secondary-color);
  transform: translateY(-3px);
}

.copyright-text {
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  font-size: 14px;
  color: rgba(255, 255, 255, 0.7);
  width: 100%; /* Asegura que la línea de borde ocupe todo el ancho */
}

/* Chatbot Styles */
.chatbot-toggle-button {
  position: fixed;
  bottom: 24px;
  right: 24px;
  background-color: var(--secondary-color);
  color: #ffffff;
  padding: 16px;
  border-radius: 9999px;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  transition: background-color 0.3s ease, transform 0.3s ease;
  z-index: 50;
  transform: scale(1);
}

.chatbot-toggle-button:hover {
  background-color: var(--hover-color);
  transform: scale(1.1);
}

.chatbot-icon {
  height: 32px;
  width: 32px;
}

.chatbot-window {
  position: fixed;
  bottom: 80px;
  right: 24px;
  width: 320px;
  background-color: var(--card-background);
  border-radius: 8px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  display: flex;
  flex-direction: column;
  z-index: 50;
  border: 1px solid var(--border-color);
}

.chatbot-header {
  background-color: var(--secondary-color);
  color: #ffffff;
  padding: 16px;
  border-top-left-radius: 8px;
  border-top-right-radius: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.chatbot-title {
  font-size: 18px;
  font-weight: 600;
}

.chatbot-close-button {
  background: none;
  border: none;
  color: #ffffff;
  cursor: pointer;
  transition: color 0.3s ease;
}

.chatbot-close-button:hover {
  color: rgba(255, 255, 255, 0.8);
}

.chatbot-close-icon {
  height: 24px;
  width: 24px;
}

.chatbot-messages {
  flex: 1;
  padding: 16px;
  overflow-y: auto; /* Habilita el scroll vertical */
  max-height: 256px; /* Altura máxima para el área de mensajes */
  /* Custom scrollbar styles */
  scrollbar-width: thin;
  scrollbar-color: #888 #f1f1f1;
}

.chatbot-messages::-webkit-scrollbar {
  width: 8px;
}
.chatbot-messages::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 10px;
}
.chatbot-messages::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 10px;
}
.chatbot-messages::-webkit-scrollbar-thumb:hover {
  background: #555;
}

.chatbot-initial-message {
  text-align: center;
  color: #6b7280;
  margin-top: 16px;
}

.message-container {
  margin-bottom: 12px;
}

.user-message-container {
  text-align: right;
}

.bot-message-container {
  text-align: left;
}

.message-bubble {
  display: inline-block;
  padding: 12px;
  border-radius: 8px;
}

.user-message-bubble {
  background-color: #e0f2fe;
  color: #1e40af;
}

.bot-message-bubble {
  background-color: #e5e7eb;
  color: #374151;
}

.chatbot-typing-indicator {
  text-align: center;
  color: #6b7280;
}

.chatbot-input-area {
  padding: 16px;
  border-top: 1px solid var(--border-color);
  display: flex;
}

.chatbot-input {
  flex: 1;
  padding: 8px 16px;
  border: 1px solid #d1d5db;
  border-top-left-radius: 8px;
  border-bottom-left-radius: 8px;
  outline: none;
  transition: border-color 0.3s ease, box-shadow 0.3s ease;
}

.chatbot-input:focus {
  border-color: var(--secondary-color);
  box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
}

.chatbot-send-button {
  background-color: var(--secondary-color);
  color: #ffffff;
  padding: 8px 16px;
  border-top-right-radius: 8px;
  border-bottom-right-radius: 8px;
  border: none;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.chatbot-send-button:hover:not(:disabled) {
  background-color: var(--hover-color);
}

.chatbot-send-button:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}


/* Responsive Design */
@media (max-width: 768px) {
  .navbar {
    padding: 0 15px;
  }

  .nav-links-desktop {
    display: none; /* Oculta la navegación de escritorio en móviles */
  }

  .menu-button-mobile {
    display: block; /* Muestra el botón de menú en móviles */
  }

  .hero-title {
    font-size: 36px;
  }

  .hero-subtitle {
    font-size: 18px;
  }

  .hero-button {
    font-size: 18px;
    padding: 12px 25px;
  }

  .section-title,
  .section-title-light,
  .card-title,
  .card-title-center {
    font-size: 30px;
    margin-bottom: 40px;
  }

  .services-grid,
  .contact-grid,
  .about-content {
    grid-template-columns: 1fr; /* Una columna en pantallas pequeñas */
  }

  .about-content {
    flex-direction: column; /* Apila el texto y la imagen */
  }

  .about-image-container {
    order: -1; /* Mueve la imagen arriba del texto en móvil */
    margin-bottom: 30px;
  }

  .contact-info-card,
  .contact-form-card,
  .cargo-generator-card {
    padding: 30px 20px;
  }

  .form-input,
  .form-textarea {
    width: calc(100% - 20px); /* Ajusta para el padding */
  }

  .footer-links {
    flex-direction: column;
    gap: 10px;
  }

  .chatbot-window {
    width: calc(100% - 48px); /* Ajusta el ancho para móviles, 24px de padding a cada lado */
    right: 24px;
    left: 24px;
    bottom: 80px;
  }
}

@media (max-width: 480px) {
  .hero-title {
    font-size: 28px;
  }

  .hero-subtitle {
    font-size: 16px;
  }

  .section-title,
  .section-title-light,
  .card-title,
  .card-title-center {
    font-size: 26px;
    margin-bottom: 30px;
  }

  .service-card-title {
    font-size: 20px;
  }

  .service-card-description {
    font-size: 15px;
  }

  .contact-details .contact-item,
  .form-label,
  .form-input,
  .form-textarea,
  .generated-description-text {
    font-size: 15px;
  }

  .submit-button,
  .generate-button,
  .copy-button {
    font-size: 16px;
    padding: 10px 20px;
  }
}
        `}
      </style>
    </div>
  );
};

export default App;
