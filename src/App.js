import React, { useState } from 'react';
// IMPORTANTE: Asegúrate de que estos archivos de imagen (CEA.png y CEAFONDO.png)
// existan en tu carpeta 'src/assets/' y que los nombres (incluyendo mayúsculas/minúsculas)
// coincidan exactamente con los nombres de los archivos en tu sistema.
import logoCamion from './assets/CEA.png';
import fondoLogistica from './assets/CEAFONDO.png';

// Componente para simular iconos de Lucide React
const Icon = ({ name, className }) => {
  let svgPath = '';
  switch (name) {
    case 'Truck':
      svgPath = 'M10 17l-5-5 5-5M19 17l-5-5 5-5';
      break;
    case 'Warehouse':
      svgPath = 'M2 20h20v-2H2v2zm2-4h16V4H4v12zm2-8h4v4H6V8zm6 0h4v4h-4V8z';
      break;
    case 'Package':
      svgPath = 'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5';
      break;
    case 'Phone':
      svgPath = 'M22 16.92v3.08a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.63A2 2 0 014.08 2H7.1a2 2 0 012 1.74 15.74 15.74 0 00.95 4.54A2 2 0 018.81 10.1l-1.43 1.43a15.94 15.94 0 006.35 6.35l1.43-1.43a2 2 0 012.48-.21 15.74 15.74 0 004.54.95 2 2 0 011.74 2z';
      break;
    case 'Mail':
      svgPath = 'M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2zM22 6l-10 7L2 6';
      break;
    case 'MapPin':
      svgPath = 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5s2.5 1.12 2.5 2.5S13.38 11.5 12 11.5z';
      break;
    case 'Menu':
      svgPath = 'M4 6h16M4 12h16M4 18h16';
      break;
    case 'X':
      svgPath = 'M18 6L6 18M6 6l12 12';
      break;
    case 'MessageSquare':
      svgPath = 'M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z';
      break;
    case 'FileText':
      svgPath = 'M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8zM14 2v6h6M10 15h4M10 11h4M10 19h4';
      break;
    default:
      svgPath = '';
  }

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d={svgPath} />
    </svg>
  );
};


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

  // Función para manejar el scroll suave
  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setIsMenuOpen(false); // Cierra el menú móvil después de hacer clic
    }
  };

  // Función para enviar mensajes al chatbot (API de Gemini)
  const sendMessageToChatbot = async () => {
    if (!userMessage.trim()) return;

    const newUserMessage = { role: 'user', parts: [{ text: userMessage }] };
    const updatedChatHistory = [...chatHistory, newUserMessage];
    setChatHistory(updatedChatHistory);
    setUserMessage('');
    setIsLoading(true);

    try {
      const payload = { contents: updatedChatHistory };
      const apiKey = ""; // La clave API se proporciona en tiempo de ejecución por Canvas
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (result.candidates && result.candidates.length > 0 &&
          result.candidates[0].content && result.candidates[0].content.parts &&
          result.candidates[0].content.parts.length > 0) {
        const botResponseText = result.candidates[0].content.parts[0].text;
        setChatHistory(prevHistory => [...prevHistory, { role: 'model', parts: [{ text: botResponseText }] }]);
      } else {
        setChatHistory(prevHistory => [...prevHistory, { role: 'model', parts: [{ text: 'Lo siento, no pude generar una respuesta. Intenta de nuevo.' }] }]);
      }
    } catch (error) {
      console.error('Error al comunicarse con el chatbot:', error);
      setChatHistory(prevHistory => [...prevHistory, { role: 'model', parts: [{ text: 'Hubo un error al conectar con el servicio. Por favor, inténtalo más tarde.' }] }]);
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

    const prompt = `Genera una descripción profesional y concisa para una publicación de carga de logística, basándote en los siguientes detalles: "${cargoDetails}". Incluye información relevante para transportistas como tipo de carga, volumen/peso estimado, origen, destino y cualquier requisito especial.`;

    try {
      const payload = { contents: [{ role: "user", parts: [{ text: prompt }] }] };
      const apiKey = ""; // La clave API se proporciona en tiempo de ejecución por Canvas
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (result.candidates && result.candidates.length > 0 &&
          result.candidates[0].content && result.candidates[0].content.parts &&
          result.candidates[0].content.parts.length > 0) {
        setGeneratedDescription(result.candidates[0].content.parts[0].text);
      } else {
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
            {/* El texto "CEA" se ha eliminado del span si solo quieres la imagen */}
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
              {isMenuOpen ? <Icon name="X" className="menu-icon" /> : <Icon name="Menu" className="menu-icon" />}
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
              <Icon name="Truck" className="service-icon" />
              <h3 className="service-card-title">Conexión de Carga y Transporte</h3>
              <p className="service-card-description"> {/* Corregido: eliminado 'className' duplicado */}
                Conectamos eficientemente a empresas que necesitan enviar mercancías con transportistas verificados, asegurando la mejor opción para cada viaje.
              </p>
            </div>
            {/* Servicio 2: Gestión de Acuerdos */}
            <div className="service-card">
              <Icon name="Warehouse" className="service-icon" />
              <h3 className="service-card-title">Gestión de Acuerdos</h3>
              <p className="service-card-description">
                Facilitamos la formalización y el seguimiento de los acuerdos de viaje, brindando seguridad y transparencia en cada transacción.
              </p>
            </div>
            {/* Servicio 3: Seguimiento y Visibilidad */}
            <div className="service-card">
              <Icon name="Package" className="service-icon" />
              <h3 className="service-card-title">Seguimiento y Visibilidad</h3>
              <p className="service-card-description"> {/* Corregido: eliminado 'className' duplicado */}
                Ofrecemos una plataforma para el seguimiento en tiempo real de los envíos, brindando total visibilidad desde el origen hasta el destino.
              </p>
            </div>
            {/* Servicio 4: Asesoramiento Logístico Personalizado */}
            <div className="service-card">
              <Icon name="Package" className="service-icon" />
              <h3 className="service-card-title">Asesoramiento Logístico Personalizado</h3>
              <p className="service-card-description">
                Brindamos consultoría experta para resolver desafíos logísticos y optimizar la cadena de intermediación entre empresas y transportistas.
              </p>
            </div>
            {/* Servicio 5: Soporte 24/7 */}
            <div className="service-card">
              <Icon name="Phone" className="service-icon" />
              <h3 className="service-card-title">Soporte 24/7</h3>
              <p className="service-card-description">
                Nuestro equipo está disponible 24/7 para ofrecer asistencia y resolver cualquier incidencia durante el proceso de conexión y transporte.
              </p>
            </div>
            {/* Servicio 6: Red de Transportistas Confiables */}
            <div className="service-card">
              <Icon name="Truck" className="service-icon" />
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
  src={logoCamion} // <--- Cambia esta línea de 'aboutUsImage' a 'logoCamion'
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
                  <Icon name="MapPin" className="contact-icon" />
                  Lules , Tucumán, Argentina
                </p>
                <p className="contact-item">
                  <Icon name="Phone" className="contact-icon" />
                  381303866
                </p>
                <p className="contact-item">
                  <Icon name="Mail" className="contact-icon" />
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
              <Icon name="FileText" className="cargo-generator-icon" />
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
                  <p className="generated-description-text">{generatedDescription}</p>
                  <button
                    onClick={() => {
                      document.execCommand('copy');
                      const textarea = document.createElement('textarea');
                      textarea.value = generatedDescription;
                      document.body.appendChild(textarea);
                      textarea.select();
                      document.execCommand('copy');
                      document.body.removeChild(textarea);
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
            {/* El texto "CEA" se ha eliminado del span si solo quieres la imagen */}
          </div>
          <ul className="footer-links">
            <li><a href="#" className="footer-link">Privacidad</a></li>
            <li><a href="#" className="footer-link">Términos</a></li>
            <li><a href="#" className="footer-link">Mapa</a></li>
          </ul>
          <div className="social-icons">
            {/* Iconos de redes sociales (placeholders) */}
            <a href="#" className="social-icon-link">
              <svg className="social-icon" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33V22C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
              </svg>
            </a>
            
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
        <Icon name="MessageSquare" className="chatbot-icon" />
      </button>

      {/* Ventana del Chatbot */}
      {isChatbotOpen && (
        <div className="chatbot-window">
          <div className="chatbot-header">
            <h3 className="chatbot-title">Asistente Virtual CEA</h3>
            <button onClick={() => setIsChatbotOpen(false)} className="chatbot-close-button">
              <Icon name="X" className="chatbot-close-icon" />
            </button>
          </div>
          <div className="chatbot-messages">
            {chatHistory.length === 0 ? (
              <div className="chatbot-initial-message">
                ¡Hola! ¿En qué puedo ayudarte hoy?
              </div>
            ) : (
              chatHistory.map((msg, index) => (
                <div key={index} className={`message-container ${msg.role === 'user' ? 'user-message-container' : 'bot-message-container'}`}>
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

      {/* Estilos CSS */}
      <style>
        {`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');

        :root {
            /* Nueva paleta de colores */
            --primary-blue:rgb(28, 31, 31); /* Azul profundo */
            --dark-blue:rgb(12, 63, 95);    /* Azul muy oscuro para gradientes */
            --light-blue: #eaf2f8;   /* Azul muy claro para fondos */
            --medium-blue: #3498db;  /* Azul estándar vibrante */
            --accent-blue: #2e86c1;  /* Azul de acento */
            --gray-bg: #f8f9fa;      /* Gris muy claro, casi blanco */
            --text-gray: #34495e;    /* Gris oscuro para texto principal */
            --light-gray-text: #7f8c8d; /* Gris para texto secundario */
            --border-gray: #dbe4eb;  /* Gris claro para bordes */
            --white: #ffffff;
            --black-overlay: rgba(0, 0, 0, 0.5);
            --green-button: #2ecc71; /* Verde fresco */
            --green-button-hover: #27ae60; /* Verde más oscuro en hover */
        }

        body {
          font-family: 'Inter', sans-serif;
          margin: 0;
          padding: 0;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          color: var(--text-gray);
          background-color: var(--gray-bg);
        }

        .app-container {
            min-height: 100vh;
            display: flex;
            flex-direction: column;
        }

        .container {
            max-width: 1200px;
            margin-left: auto;
            margin-right: auto;
            padding-left: 1.5rem; /* px-6 */
            padding-right: 1.5rem; /* px-6 */
        }

        /* Header */
        .header {
            background-color: var(--white);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15); /* Sombra más pronunciada */
            padding-top: 1rem; /* py-4 */
            padding-bottom: 1rem; /* py-4 */
            position: sticky;
            top: 0;
            z-index: 50;
            border-bottom-left-radius: 0.75rem; /* rounded-b-lg */
            border-bottom-right-radius: 0.75rem; /* rounded-b-lg */
        }

        .navbar {
            display: flex;
            justify-content: space-between;
            align-items: center;
            max-width: 1200px;
            margin-left: auto;
            margin-right: auto;
            padding-left: 1.5rem; /* px-6 */
            padding-right: 1.5rem; /* px-6 */
        }
        @media (min-width: 768px) { /* md */
            .navbar {
                padding-left: 3rem; /* md:px-12 */
                padding-right: 3rem; /* md:px-12 */
            }
        }

        .logo-container {
            display: flex;
            align-items: center;
            gap: 0.75rem; /* Aumentado el espacio */
        }

        .logo-icon {
            height: 5.5rem; /* Aumentado el tamaño del icono */
            width: 5.5rem; /* Aumentado el tamaño del icono */
            /* El color no afecta a una imagen, pero se mantiene por si se vuelve a usar un SVG */
            transition: transform 0.3s ease; /* Efecto de transición */
        }
        .logo-icon:hover {
            transform: scale(1.1) rotate(-5deg); /* Efecto en hover */
        }

        /* El logo-text span se ha eliminado del JSX, por lo que estas reglas ya no se aplicarán directamente */
        .logo-text {
            font-size: 2.5rem; /* Aumentado el tamaño del texto */
            font-weight: 800; /* Más audaz */
            color: var(--primary-blue);
            transition: color 0.3s ease;
        }
        .logo-text:hover {
            color: var(--accent-blue);
        }

        .nav-links-desktop {
            display: none;
            list-style: none;
            margin: 0;
            padding: 0;
            gap: 2.5rem; /* Aumentado el espacio entre links */
        }
        @media (min-width: 768px) { /* md */
            .nav-links-desktop {
                display: flex;
            }
        }

        .nav-button {
            color: var(--text-gray);
            transition: color 0.3s ease, transform 0.2s ease; /* Más efectos */
            font-weight: 600; /* Más audaz */
            background: none;
            border: none;
            cursor: pointer;
            padding: 0.5rem 0;
        }
        .nav-button:hover {
            color: var(--accent-blue);
            transform: translateY(-3px); /* Pequeño levantamiento */
        }

        .menu-button-mobile {
            display: block;
        }
        @media (min-width: 768px) { /* md */
            .menu-button-mobile {
                display: none;
            }
        }

        .menu-icon {
            height: 2rem; /* h-8 */
            width: 2rem; /* w-8 */
            color: var(--text-gray);
        }

        .mobile-menu {
            background-color: var(--white);
            margin-top: 1rem; /* mt-4 */
            border-radius: 0.75rem; /* rounded-lg */
            box-shadow: 0 10px 20px rgba(0, 0, 0, 0.15); /* Sombra más fuerte */
        }
        @media (min-width: 768px) { /* md */
            .mobile-menu {
                display: none;
            }
        }

        .mobile-nav-links {
            display: flex;
            flex-direction: column;
            align-items: center;
            padding-top: 1rem; /* py-4 */
            padding-bottom: 1rem; /* py-4 */
            gap: 1.25rem; /* space-y-4 */
            list-style: none;
            margin: 0;
        }

        .mobile-nav-button {
            color: var(--text-gray);
            transition: color 0.3s ease;
            font-weight: 600; /* Más audaz */
            font-size: 1.25rem; /* text-lg */
            background: none;
            border: none;
            cursor: pointer;
            padding: 0.5rem 0;
        }
        .mobile-nav-button:hover {
            color: var(--accent-blue);
        }

        /* Hero Section */
        .hero-section {
            position: relative;
            color: var(--white);
            padding-top: 7rem; /* py-24 */
            padding-bottom: 7rem; /* py-24 */
            overflow: hidden;
            border-bottom-left-radius: 0.75rem;
            border-bottom-right-radius: 0.75rem;
            display: flex;
            align-items: center;
            justify-content: center;
            text-align: center;
            background-size: cover;
            background-position: center;
            background-attachment: fixed;
        }
        @media (min-width: 768px) { /* md */
            .hero-section {
                padding-top: 9rem; /* md:py-32 */
                padding-bottom: 9rem; /* md:py-32 */
            }
        }

        .hero-overlay {
            position: absolute;
            inset: 0;
            background-color: var(--black-overlay);
            z-index: 10;
        }

        .hero-content {
            position: relative;
            z-index: 20;
            max-width: 1200px;
            margin-left: auto;
            margin-right: auto;
            padding-left: 1.5rem;
            padding-right: 1.5rem;
        }

        .hero-title {
            font-size: 2.75rem; /* Más grande */
            font-weight: 900; /* Más audaz */
            line-height: 1.2;
            margin-bottom: 1.5rem;
            animation: fadeInDown 1s ease-out forwards;
        }
        @media (min-width: 768px) { /* md */
            .hero-title {
                font-size: 4.5rem; /* Más grande en desktop */
            }
        }

        .hero-subtitle {
            font-size: 1.25rem;
            margin-bottom: 2.5rem;
            max-width: 48rem;
            margin-left: auto;
            margin-right: auto;
            opacity: 0;
            animation: fadeInUp 1s ease-out forwards;
            animation-delay: 0.5s;
            animation-fill-mode: forwards;
        }
        @media (min-width: 768px) { /* md */
            .hero-subtitle {
                font-size: 1.375rem;
            }
        }

        .hero-button {
            background-color: var(--white);
            color: var(--primary-blue);
            padding: 1.125rem 2.25rem; /* Más padding */
            border-radius: 9999px;
            font-size: 1.25rem; /* Más grande */
            font-weight: 700; /* Más audaz */
            box-shadow: 0 15px 25px rgba(0, 0, 0, 0.2); /* Sombra más fuerte */
            transform: scale(1);
            transition: transform 0.3s ease, background-color 0.3s ease;
            opacity: 0;
            animation: fadeInUp 1s ease-out forwards;
            animation-delay: 1s;
            animation-fill-mode: forwards;
            border: none;
            cursor: pointer;
        }
        .hero-button:hover {
            background-color: var(--light-blue);
            transform: scale(1.08); /* Efecto de escala más pronunciado */
        }

        /* Services Section */
        .services-section {
            padding-top: 5rem;
            padding-bottom: 5rem;
            background-color: var(--gray-bg);
        }
        @media (min-width: 768px) {
            .services-section {
                padding-top: 7rem;
                padding-bottom: 7rem;
            }
        }

        .section-title {
            font-size: 2.5rem;
            font-weight: 800;
            color: var(--text-gray);
            margin-bottom: 3.5rem;
            text-align: center;
        }

        .services-grid {
            display: grid;
            grid-template-columns: 1fr;
            gap: 2rem;
        }
        @media (min-width: 768px) {
            .services-grid {
                grid-template-columns: repeat(2, 1fr);
            }
        }
        @media (min-width: 1024px) {
            .services-grid {
                grid-template-columns: repeat(3, 1fr);
            }
        }

        .service-card {
            background-color: var(--white);
            padding: 2.25rem; /* Más padding */
            border-radius: 1rem; /* Más redondeado */
            box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1); /* Sombra más suave */
            transition: all 0.3s ease;
            transform: translateY(0);
            border: 1px solid var(--border-gray);
        }
        .service-card:hover {
            box-shadow: 0 15px 30px rgba(0, 0, 0, 0.15); /* Sombra más fuerte en hover */
            transform: translateY(-0.75rem); /* Efecto de levantamiento más pronunciado */
        }

        .service-icon {
            height: 4.5rem; /* Aumentado el tamaño del icono */
            width: 4.5rem; /* Aumentado el tamaño del icono */
            color: var(--medium-blue); /* Color ajustado */
            margin-left: auto;
            margin-right: auto;
            margin-bottom: 1.75rem;
        }

        .service-card-title {
            font-size: 1.625rem; /* Más grande */
            font-weight: 700;
            color: var(--text-gray);
            margin-bottom: 1.25rem;
        }

        .service-card-description {
            color: var(--light-gray-text);
            line-height: 1.6;
        }

        /* About Us Section */
        .about-section {
            padding-top: 5rem;
            padding-bottom: 5rem;
            background-color: var(--primary-blue); /* Color ajustado */
            color: var(--white);
            border-top-left-radius: 0.75rem;
            border-top-right-radius: 0.75rem;
        }
        @media (min-width: 768px) {
            .about-section {
                padding-top: 7rem;
                padding-bottom: 7rem;
            }
        }

        .about-content {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 3.5rem; /* Más espacio */
            text-align: center;
        }
        @media (min-width: 768px) {
            .about-content {
                flex-direction: row;
                text-align: left;
            }
        }

        .about-text {
            width: 100%;
        }
        @media (min-width: 768px) {
            .about-text {
                width: 50%;
            }
        }

        .section-title-light {
            font-size: 2.5rem;
            font-weight: 800;
            margin-bottom: 1.75rem;
        }

        .about-description {
            font-size: 1.125rem;
            line-height: 1.7;
            margin-bottom: 1.5rem;
        }
        .about-description:last-child {
            margin-bottom: 0;
        }

        .about-image-container {
            width: 100%;
        }
        @media (min-width: 768px) {
            .about-image-container {
                width: 50%;
            }
        }

        .about-image {
            border-radius: 1rem; /* Más redondeado */
            box-shadow: 0 25px 50px rgba(0, 0, 0, 0.3); /* Sombra más fuerte */
            width: 100%;
            height: auto;
            object-fit: cover;
        }

        /* Contact Section */
        .contact-section {
            padding-top: 5rem;
            padding-bottom: 5rem;
            background-color: var(--gray-bg);
        }
        @media (min-width: 768px) {
            .contact-section {
                padding-top: 7rem;
                padding-bottom: 7rem;
            }
        }

        .contact-grid {
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: flex-start;
            gap: 3.5rem;
        }
        @media (min-width: 768px) {
            .contact-grid {
                flex-direction: row;
            }
        }

        .contact-info-card, .contact-form-card {
            background-color: var(--white);
            padding: 2.25rem; /* Más padding */
            border-radius: 1rem; /* Más redondeado */
            box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
            border: 1px solid var(--border-gray);
            width: 100%;
        }
        @media (min-width: 768px) {
            .contact-info-card {
                width: 33.333333%;
            }
            .contact-form-card {
                width: 66.666667%;
            }
        }

        .card-title {
            font-size: 1.625rem;
            font-weight: 700;
            color: var(--text-gray);
            margin-bottom: 1.75rem;
        }

        .contact-details {
            display: flex;
            flex-direction: column;
            gap: 1.25rem;
            text-align: left;
        }

        .contact-item {
            display: flex;
            align-items: center;
            color: var(--text-gray);
            font-size: 1rem;
        }

        .contact-icon {
            height: 1.75rem; /* Más grande */
            width: 1.75rem; /* Más grande */
            color: var(--medium-blue);
            margin-right: 0.75rem;
        }

        .contact-form {
            display: flex;
            flex-direction: column;
            gap: 1.75rem; /* Más espacio */
        }

        .form-group {
            text-align: left;
        }

        .form-label {
            display: block;
            color: var(--text-gray);
            font-size: 0.9375rem; /* Ligeramente más grande */
            font-weight: 600; /* Más audaz */
            margin-bottom: 0.625rem;
        }

        .form-input, .form-textarea {
            width: 100%;
            padding: 0.875rem 1.125rem; /* Más padding */
            border: 1px solid var(--border-gray);
            border-radius: 0.625rem; /* Más redondeado */
            outline: none;
            transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }
        .form-input:focus, .form-textarea:focus {
            border-color: var(--medium-blue);
            box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.4); /* Sombra de foco más suave */
        }
        .form-textarea {
            resize: vertical;
        }

        .submit-button {
            width: 100%;
            background-color: var(--accent-blue);
            color: var(--white);
            padding: 0.875rem 1.75rem; /* Más padding */
            border-radius: 0.625rem; /* Más redondeado */
            font-weight: 700; /* Más audaz */
            transition: background-color 0.3s ease, transform 0.3s ease, box-shadow 0.3s ease;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15); /* Sombra más pronunciada */
            transform: scale(1);
            border: none;
            cursor: pointer;
        }
        .submit-button:hover {
            background-color: var(--primary-blue);
            transform: scale(1.03);
            box-shadow: 0 6px 12px rgba(0, 0, 0, 0.2);
        }

        /* Cargo Generator Section */
        .cargo-generator-card {
            margin-top: 5rem; /* Más margen */
            background-color: var(--white);
            padding: 2.5rem; /* Más padding */
            border-radius: 1rem; /* Más redondeado */
            box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
            border: 1px solid var(--border-gray);
            text-align: center;
        }

        .card-title-center {
            font-size: 1.625rem;
            font-weight: 700;
            color: var(--text-gray);
            margin-bottom: 1.75rem;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .cargo-generator-icon {
            height: 2.25rem; /* Más grande */
            width: 2.25rem; /* Más grande */
            color: var(--medium-blue);
            margin-right: 0.75rem;
        }

        .cargo-generator-description {
            color: var(--light-gray-text);
            margin-bottom: 1.25rem;
            line-height: 1.6;
        }

        .cargo-generator-form {
            display: flex;
            flex-direction: column;
            gap: 1.25rem;
        }

        .generate-button {
            width: 100%;
            background-color: var(--green-button);
            color: var(--white);
            padding: 0.875rem 1.75rem;
            border-radius: 0.625rem;
            font-weight: 700;
            transition: background-color 0.3s ease, transform 0.3s ease, box-shadow 0.3s ease;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
            transform: scale(1);
            border: none;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .generate-button:hover {
            background-color: var(--green-button-hover);
            transform: scale(1.03);
            box-shadow: 0 6px 12px rgba(0, 0, 0, 0.2);
        }
        .generate-button:disabled {
            opacity: 0.6; /* Ligeramente más opaco */
            cursor: not-allowed;
            transform: scale(1); /* Sin efecto de escala al estar deshabilitado */
            box-shadow: none;
        }

        .spinner {
            animation: spin 1s linear infinite;
            -webkit-animation: spin 1s linear infinite;
            height: 1.25rem;
            width: 1.25rem;
            color: var(--white);
            margin-right: 0.75rem;
        }
        @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }
        @-webkit-keyframes spin {
            from { -webkit-transform: rotate(0deg); }
            to { -webkit-transform: rotate(360deg); }
        }

        .generated-description-box {
            margin-top: 1.75rem;
            padding: 1.25rem; /* Más padding */
            background-color: var(--light-blue);
            border: 1px solid var(--medium-blue);
            border-radius: 0.625rem;
            text-align: left;
            box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.05); /* Sombra interna sutil */
        }

        .generated-description-title {
            font-size: 1.1875rem; /* Ligeramente más grande */
            font-weight: 700;
            color: var(--primary-blue);
            margin-bottom: 0.625rem;
        }

        .generated-description-text {
            color: var(--text-gray);
            white-space: pre-wrap;
            line-height: 1.6;
        }

        .copy-button {
            margin-top: 1rem;
            background-color: var(--medium-blue);
            color: var(--white);
            padding: 0.625rem 1.125rem; /* Más padding */
            border-radius: 0.625rem;
            font-size: 0.9375rem; /* Ligeramente más grande */
            transition: background-color 0.3s ease, transform 0.2s ease;
            border: none;
            cursor: pointer;
        }
        .copy-button:hover {
            background-color: var(--accent-blue);
            transform: translateY(-2px); /* Pequeño levantamiento */
        }

        /* Footer */
        .footer {
            background-color: var(--text-gray);
            color: var(--white);
            padding-top: 3rem;
            padding-bottom: 2.5rem;
            border-top-left-radius: 0.75rem;
            border-top-right-radius: 0.75rem;
            margin-top: auto; /* Empuja el footer hacia abajo */
        }

        .footer-content {
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 1.5rem;
            /* Aumenta el padding horizontal para más espacio en los lados */
            padding-left: 2rem; /* Nuevo */
            padding-right: 2rem; /* Nuevo */
        }
        @media (min-width: 768px) {
            .footer-content {
                flex-direction: row;
                /* Añade un gap para separar los elementos en escritorio */
                gap: 3rem; /* Nuevo: Aumenta el espacio entre el logo, enlaces y iconos */
                padding-left: 3rem; /* Nuevo: Más padding en desktop */
                padding-right: 3rem; /* Nuevo: Más padding en desktop */
            }
        }

        .logo-container-footer {
            display: flex;
            align-items: center;
            gap: 0.625rem;
            margin-bottom: 2rem; /* Aumentado para más espacio debajo del logo en móvil */
        }
        @media (min-width: 768px) {
            .logo-container-footer {
                margin-bottom: 0;
            }
        }

        .social-icons {
            display: flex;
            gap: 1.5rem; /* Ligeramente aumentado el espacio entre los iconos individuales */
            margin-top: 2rem; /* Aumentado para más espacio encima de los iconos en móvil */
        }
        @media (min-width: 768px) {
            .social-icons {
                margin-top: 0;
            }
        }

        .logo-icon-footer {
            height: 3.5rem; /* Más grande */
            width: 4.5rem; /* Más grande */
            color:rgb(11, 38, 91); /* Un azul más claro para el footer */
            transition: transform 0.3s ease;
        }
        .logo-icon-footer:hover {
            transform: scale(1.1) rotate(5deg);
        }

        /* El logo-text-footer span se ha eliminado del JSX, por lo que estas reglas ya no se aplicarán directamente */
        .logo-text-footer {
            font-size: 1.75rem; /* Más grande */
            font-weight: 700;
            color: #9bbbdc;
            transition: color 0.3s ease;
        }
        .logo-text-footer:hover {
            color: var(--white);
        }

        .footer-links {
            display: flex;
            list-style: none;
            margin: 0;
            padding: 0;
            gap: 1.75rem;
        }

        .footer-link {
            color: #c0c4c7; /* Gris más claro */
            transition: color 0.3s ease;
            text-decoration: none;
            font-weight: 500;
        }
        .footer-link:hover {
            color: var(--white);
        }

        .social-icons {
            display: flex;
            gap: 1.25rem;
            margin-top: 1rem;
        }
        @media (min-width: 768px) {
            .social-icons {
                margin-top: 0;
            }
        }

        .social-icon-link {
            color: #c0c4c7;
            transition: color 0.3s ease, transform 0.2s ease;
        }
        .social-icon-link:hover {
            color: var(--white);
            transform: translateY(-2px);
        }

        .social-icon {
            height: 1.625rem; /* Ligeramente más grande */
            width: 1.625rem;
        }

        .copyright-text {
            color: #aeb5bb; /* Gris más oscuro */
            font-size: 0.9375rem;
            margin-top: 2rem; /* Más margen */
            text-align: center;
            width: 100%;
        }


        /* Chatbot Styles */
        .chatbot-toggle-button {
            position: fixed;
            bottom: 1.75rem;
            right: 1.75rem;
            background-color: var(--accent-blue);
            color: var(--white);
            padding: 1.125rem; /* Más padding */
            border-radius: 9999px;
            box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2); /* Sombra más fuerte */
            transition: background-color 0.3s ease, transform 0.3s ease;
            z-index: 50;
            transform: scale(1);
            border: none;
            cursor: pointer;
        }
        .chatbot-toggle-button:hover {
            background-color: var(--primary-blue);
            transform: scale(1.15); /* Efecto de escala más pronunciado */
        }

        .chatbot-icon {
            height: 2.25rem; /* Más grande */
            width: 2.25rem;
        }

        .chatbot-window {
            position: fixed;
            bottom: 6rem; /* bottom-20 */
            right: 1.75rem; /* right-6 */
            width: 20rem; /* w-80 */
            background-color: var(--white);
            border-radius: 0.75rem; /* Más redondeado */
            box-shadow: 0 25px 50px rgba(0, 0, 0, 0.3); /* Sombra más fuerte */
            display: flex;
            flex-direction: column;
            z-index: 50;
            border: 1px solid var(--border-gray);
        }
        @media (min-width: 768px) { /* md */
            .chatbot-window {
                width: 26rem; /* Más ancho en desktop */
            }
        }

        .chatbot-header {
            background-color: var(--accent-blue);
            color: var(--white);
            padding: 1.125rem;
            border-top-left-radius: 0.75rem;
            border-top-right-radius: 0.75rem;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .chatbot-title {
            font-size: 1.25rem; /* Más grande */
            font-weight: 700;
        }

        .chatbot-close-button {
            background: none;
            border: none;
            color: var(--white);
            cursor: pointer;
            transition: color 0.3s ease;
        }
        .chatbot-close-button:hover {
            color: #eaf2f8; /* light-blue */
        }

        .chatbot-close-icon {
            height: 1.625rem; /* Más grande */
            width: 1.625rem;
        }

        .chatbot-messages {
            flex: 1;
            padding: 1.25rem;
            overflow-y-auto;
            height: 18rem; /* Más alto */
        }

        .chatbot-initial-message {
            text-align: center;
            color: var(--light-gray-text);
            margin-top: 1rem;
            font-style: italic;
        }

        .message-container {
            margin-bottom: 0.875rem;
        }

        .user-message-container {
            text-align: right;
        }

        .bot-message-container {
            text-align: left;
        }

        .message-bubble {
            display: inline-block;
            padding: 0.875rem; /* Más padding */
            border-radius: 0.625rem;
            max-width: 85%; /* Limita el ancho de los mensajes */
            word-wrap: break-word; /* Rompe palabras largas */
        }

        .user-message-bubble {
            background-color: var(--light-blue);
            color: var(--primary-blue);
        }

        .bot-message-bubble {
            background-color: var(--border-gray);
            color: var(--text-gray);
        }

        .chatbot-typing-indicator {
            text-align: center;
            color: var(--light-gray-text);
            font-style: italic;
        }

        .chatbot-input-area {
            padding: 1.25rem;
            border-top: 1px solid var(--border-gray);
            display: flex;
        }

        .chatbot-input {
            flex: 1;
            padding: 0.625rem 1.125rem;
            border: 1px solid var(--border-gray);
            border-top-left-radius: 0.625rem;
            border-bottom-left-radius: 0.625rem;
            outline: none;
            transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }
        .chatbot-input:focus {
            border-color: var(--medium-blue);
            box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.4);
        }
        .chatbot-input:disabled {
            background-color: #f3f4f6;
            cursor: not-allowed;
        }

        .chatbot-send-button {
            background-color: var(--accent-blue);
            color: var(--white);
            padding: 0.625rem 1.125rem;
            border-top-right-radius: 0.625rem;
            border-bottom-right-radius: 0.625rem;
            transition: background-color 0.3s ease;
            border: none;
            cursor: pointer;
        }
        .chatbot-send-button:hover {
            background-color: var(--primary-blue);
        }
        .chatbot-send-button:disabled {
            opacity: 0.6;
            cursor: not-allowed;
        }

        /* Custom Scrollbar */
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
        `}
      </style>
    </div>
  );
};

export default App;
