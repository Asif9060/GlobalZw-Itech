export default function Process() {
  return (
    <section id="process" className="sec-pad">
      <div style={{ maxWidth: 1100, margin: "0 auto", textAlign: "center" }}>
        <div className="rv">
          <span className="eyebrow" style={{ justifyContent: "center" }}>
            How it works
          </span>
        </div>
        <h2 className="mask-title">
          <span className="lm">
            <i>From first ray to full power</i>
          </span>
          <span className="lm">
            <i>in five simple steps.</i>
          </span>
        </h2>
      </div>
      <div className="proc-wrap">
        <div className="proc-line">
          <i id="procFill"></i>
        </div>
        <div className="step">
          <div className="step-body rv-l">
            <h4>01 · Send your query</h4>
            <p>
              Fill the form below or call us. Tell us your bill, roof and goals —
              we respond within 24 hours.
            </p>
          </div>
          <div className="step-dot rv-s">01</div>
        </div>
        <div className="step">
          <div className="step-dot rv-s">02</div>
          <div className="step-body rv-r">
            <h4>Free site assessment</h4>
            <p>
              Our engineers survey your site, analyse shading and structural
              data, and profile your consumption.
            </p>
          </div>
        </div>
        <div className="step">
          <div className="step-body rv-l">
            <h4>03 · Custom design &amp; quote</h4>
            <p>
              Receive a certified 3D system design, ROI model and fixed-price
              quote within 48 hours.
            </p>
          </div>
          <div className="step-dot rv-s">03</div>
        </div>
        <div className="step">
          <div className="step-dot rv-s">04</div>
          <div className="step-body rv-r">
            <h4>Professional installation</h4>
            <p>
              Certified crews install and commission your system — most homes go
              live in a single day.
            </p>
          </div>
        </div>
        <div className="step">
          <div className="step-body rv-l">
            <h4>05 · Monitor &amp; save</h4>
            <p>
              Track production live, receive proactive maintenance and watch your
              savings compound.
            </p>
          </div>
          <div className="step-dot rv-s">05</div>
        </div>
      </div>
    </section>
  );
}
