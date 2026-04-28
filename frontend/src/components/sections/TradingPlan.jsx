const RULES = [
  'No operar señales propias (solo seguir las academias).',
  'Retirar el 85% del profit para asegurar tranquilidad estadística.',
  'Confirmar dirección del mercado en D1 y H4 antes de entrar.',
  'Calcular riesgo por operación: máximo 2% del balance.',
  'Definir Stop Loss basado en estructura, no en cantidad fija.',
  'Take Profit en niveles de soporte/resistencia clave.',
  'No operar durante noticias de alto impacto (NFP, FOMC, CPI).',
  'Registrar cada operación en el journal inmediatamente al cerrar.',
];

function TradingPlan() {
  return (
    <div className="tt-trading-plan">
      {/* ── Reglas del plan ── */}
      <section className="tt-trading-plan__checklist-section">
        <h2 className="tt-trading-plan__section-title">Reglas del Plan</h2>
        <ul className="tt-trading-plan__rules">
          {RULES.map((rule, i) => (
            <li key={i} className="tt-trading-plan__rule-item">
              <span className="tt-trading-plan__rule-bullet" aria-hidden="true">→</span>
              <span className="tt-trading-plan__rule-text">{rule}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* ── Mentalidad ── */}
      <section className="tt-trading-plan__motivation-section">
        <h2 className="tt-trading-plan__section-title">Mentalidad</h2>
        <div className="tt-trading-plan__motivation-card">
          <p className="tt-trading-plan__motivation-quote">
            &ldquo;El trading exitoso no es sobre predecir el mercado — es sobre gestionar
            el riesgo con disciplina consistente.&rdquo;
          </p>
          <div className="tt-trading-plan__motivation-rules">
            <div className="tt-trading-plan__motivation-rule">
              <span className="tt-trading-plan__motivation-rule-icon">→</span>
              <span>Esto es una profesión seria. No te harás millonario de la noche a la mañana.</span>
            </div>
            <div className="tt-trading-plan__motivation-rule">
              <span className="tt-trading-plan__motivation-rule-icon">→</span>
              <span>Lo haces de forma disciplinada como un ingreso extra para cumplir tus sueños.</span>
            </div>
            <div className="tt-trading-plan__motivation-rule">
              <span className="tt-trading-plan__motivation-rule-icon">→</span>
              <span>Cada operación es una decisión de negocio. Las emociones no tienen lugar aquí.</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default TradingPlan;
