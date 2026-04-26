import { ArrowRightOutlined } from '@ant-design/icons';
import { Button } from 'antd';
import { Link } from 'react-router-dom';

export default function CTABand() {
  return (
    <section
      style={{
        position: 'relative',
        overflow: 'hidden',
        padding: '96px 24px',
        background: 'linear-gradient(135deg, #1E1B4B 0%, #312E81 50%, #4338CA 100%)',
        color: '#FFFFFF',
      }}
    >
      <div
        aria-hidden
        style={{
          position: 'absolute',
          top: '-30%',
          right: '-5%',
          width: 460,
          height: 460,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(139,92,246,0.55), transparent 60%)',
          filter: 'blur(50px)',
          animation: 'as-float-orb 16s ease-in-out infinite',
          pointerEvents: 'none',
        }}
      />
      <div
        aria-hidden
        style={{
          position: 'absolute',
          bottom: '-40%',
          left: '5%',
          width: 460,
          height: 460,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(6,182,212,0.40), transparent 60%)',
          filter: 'blur(60px)',
          animation: 'as-float-orb 22s ease-in-out infinite reverse',
          pointerEvents: 'none',
        }}
      />

      <div
        style={{
          position: 'relative',
          zIndex: 1,
          maxWidth: 900,
          margin: '0 auto',
          textAlign: 'center',
        }}
      >
        <h2
          style={{
            margin: 0,
            fontSize: 42,
            lineHeight: 1.15,
            fontWeight: 700,
            letterSpacing: '-0.02em',
          }}
        >
          Stop juggling inboxes.
        </h2>
        <p
          style={{
            margin: '14px auto 0',
            maxWidth: 560,
            fontSize: 16,
            opacity: 0.85,
            lineHeight: 1.55,
          }}
        >
          Bring everything together in a workspace that&apos;s actually pleasant to use.
        </p>
        <div style={{ marginTop: 28, display: 'flex', justifyContent: 'center' }}>
          <Link to="/sign-up">
            <Button
              size="large"
              style={{
                background: '#FFFFFF',
                color: '#312E81',
                fontWeight: 700,
                border: 'none',
                height: 50,
                paddingInline: 26,
                fontSize: 15,
                boxShadow: '0 14px 28px rgba(0,0,0,0.25)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              Get started — free
              <ArrowRightOutlined />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
