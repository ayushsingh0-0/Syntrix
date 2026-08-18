import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Sparkles } from 'lucide-react';
import { useAuth, useToast } from '../../context';
import { getErrorMessage } from '../../utils/error';
import { TextEffect } from '../../components/core/text-effect';
import { Logo } from '../../components/common/Logo';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await login(email.trim(), password);
      showToast('success', 'Welcome back to Syntrix!');
      navigate('/');
    } catch (err: unknown) {
      showToast('error', getErrorMessage(err, 'Login failed. Check your credentials.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const fillDemoAccount = async (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setIsSubmitting(true);
    try {
      await login(demoEmail, demoPass);
      showToast('success', 'Logged in as Demo User!');
      navigate('/');
    } catch (err: unknown) {
      showToast('error', getErrorMessage(err, 'Demo login failed.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        fontFamily: "'Plus Jakarta Sans', Inter, ui-sans-serif, system-ui, -apple-system, sans-serif",
        color: '#20201D',
        background:
          'radial-gradient(circle at 12% 18%, rgba(245, 174, 77, 0.13), transparent 24%), radial-gradient(circle at 88% 82%, rgba(245, 174, 77, 0.10), transparent 22%), #F5F3EB',
        position: 'relative',
        boxSizing: 'border-box',
      }}
    >
      {/* Brand Header */}
      <header
        style={{
          position: 'absolute',
          left: '48px',
          top: '34px',
          zIndex: 10,
        }}
      >
        <Logo size="lg" to="/" />
      </header>

      {/* Top Navigation Links */}
      <nav
        style={{
          position: 'absolute',
          right: '48px',
          top: '34px',
          display: 'flex',
          gap: '24px',
          alignItems: 'center',
          fontSize: '13px',
          color: '#77756D',
          zIndex: 10,
        }}
      >
        <a href="#product" style={{ textDecoration: 'none', color: '#77756D', fontWeight: 600 }}>
          Product
        </a>
        <a href="mailto:contact@syntrix.io" style={{ textDecoration: 'none', color: '#77756D', fontWeight: 600 }}>
          Contact
        </a>
        <Link
          to="/register"
          style={{
            background: '#F5AE4D',
            color: '#20201D',
            padding: '11px 18px',
            borderRadius: '10px',
            fontWeight: 700,
            textDecoration: 'none',
            transition: 'all 0.2s ease',
            boxShadow: '0 2px 8px rgba(245, 174, 77, 0.3)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#E99532';
            e.currentTarget.style.transform = 'translateY(-1px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#F5AE4D';
            e.currentTarget.style.transform = 'none';
          }}
        >
          Request demo
        </Link>
      </nav>

      {/* Main Page Layout */}
      <main
        style={{
          minHeight: '100vh',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          padding: '24px',
          boxSizing: 'border-box',
        }}
      >
        {/* Left Visual Illustration Section */}
        <section
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            minHeight: 'calc(100vh - 48px)',
            borderRadius: '28px',
          }}
        >
          <div
            style={{
              width: 'min(720px, 92%)',
              position: 'relative',
              padding: '100px 20px 40px',
            }}
          >
            <div
              style={{
                display: 'inline-flex',
                gap: '8px',
                alignItems: 'center',
                background: '#FFF8ED',
                border: '1px solid #F3DFC4',
                borderRadius: '999px',
                padding: '8px 14px',
                fontSize: '12px',
                fontWeight: 750,
                color: '#20201D',
                marginBottom: '16px',
              }}
            >
              ✦ Built for teams that move together
            </div>

            <h1
              style={{
                fontSize: 'clamp(38px, 4.8vw, 70px)',
                lineHeight: 1.12,
                letterSpacing: '-0.05em',
                margin: '16px 0 20px',
                maxWidth: '620px',
                color: '#20201D',
                fontWeight: 800,
              }}
            >
              <TextEffect per="word" as="span" preset="fade-in-blur" delay={0.15} speedReveal={0.18}>
                Work better.
              </TextEffect>
              <br />
              <TextEffect
                per="word"
                as="span"
                preset="fade-in-blur"
                delay={0.45}
                speedReveal={0.18}
                style={{
                  color: '#D97706',
                  display: 'inline-flex',
                  overflow: 'visible',
                  paddingBottom: '0.15em',
                }}
              >
                Build together.
              </TextEffect>
            </h1>

            <TextEffect
              per="word"
              as="p"
              preset="fade"
              delay={0.8}
              speedReveal={0.06}
              style={{
                fontSize: '16px',
                lineHeight: 1.65,
                color: '#77756D',
                maxWidth: '520px',
                margin: 0,
              }}
            >
              Syntrix brings conversations, tasks and shared work into one calm workspace—so your team can focus on
              making progress.
            </TextEffect>

            {/* Custom SVG Collaboration Artwork */}
            <div style={{ position: 'relative', height: '320px', marginTop: '28px' }}>
              <svg
                viewBox="0 0 720 330"
                xmlns="http://www.w3.org/2000/svg"
                aria-label="Collaboration illustration"
                style={{ width: '100%', height: '100%', display: 'block' }}
              >
                <defs>
                  <filter id="svg-shadow-login" x="-10%" y="-10%" width="130%" height="130%">
                    <feDropShadow dx="0" dy="16" stdDeviation="16" floodOpacity="0.09" />
                  </filter>
                </defs>

                <path
                  d="M65 270 C120 210,125 120,185 92 C240 66,285 110,338 76 C390 43,425 57,475 83 C530 112,574 98,653 52"
                  fill="none"
                  stroke="#DDD9CC"
                  strokeWidth="2"
                  strokeDasharray="6 8"
                />
                <circle cx="93" cy="87" r="6" fill="#F5AE4D" />
                <circle cx="631" cy="255" r="4" fill="#F5AE4D" />

                <g filter="url(#svg-shadow-login)">
                  <rect x="54" y="122" width="215" height="148" rx="18" fill="#FFFDF8" stroke="#E9E6DC" />
                  <rect x="79" y="150" width="118" height="9" rx="4.5" fill="#20201D" />
                  <rect x="79" y="169" width="155" height="7" rx="3.5" fill="#E7E3D8" />
                  <rect x="79" y="199" width="150" height="36" rx="10" fill="#FCE5C2" />
                  <circle cx="98" cy="217" r="11" fill="#F5AE4D" />
                  <circle cx="127" cy="217" r="11" fill="#E4EEE5" />
                  <circle cx="156" cy="217" r="11" fill="#ECE9E0" />
                  <path d="M198 207h20M198 218h12" stroke="#9A978D" strokeWidth="3" strokeLinecap="round" />
                </g>

                <g filter="url(#svg-shadow-login)">
                  <rect x="326" y="55" width="190" height="126" rx="18" fill="#FFFDF8" stroke="#E9E6DC" />
                  <circle cx="355" cy="88" r="18" fill="#FCE5C2" />
                  <circle cx="355" cy="83" r="6" fill="#20201D" />
                  <path d="M343 96c4-8 20-8 24 0" fill="#20201D" />
                  <rect x="386" y="76" width="82" height="8" rx="4" fill="#20201D" />
                  <rect x="386" y="92" width="104" height="6" rx="3" fill="#DDD9CC" />
                  <rect x="349" y="120" width="139" height="8" rx="4" fill="#EEEADF" />
                  <rect x="349" y="137" width="108" height="8" rx="4" fill="#EEEADF" />
                </g>

                <g filter="url(#svg-shadow-login)">
                  <rect x="390" y="194" width="270" height="86" rx="18" fill="#20201D" />
                  <text x="416" y="224" fill="#F5F1E7" fontSize="12" fontFamily="Inter, sans-serif" fontWeight="700">
                    Team workspace
                  </text>
                  <rect x="416" y="240" width="100" height="7" rx="3.5" fill="#77756D" />
                  <rect x="416" y="255" width="148" height="7" rx="3.5" fill="#77756D" />
                  <circle cx="611" cy="238" r="16" fill="#F5AE4D" />
                  <path
                    d="M605 238l5 5 9-11"
                    fill="none"
                    stroke="#20201D"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </g>

                <g>
                  <circle cx="294" cy="221" r="27" fill="#F5AE4D" />
                  <path d="M281 221h26M294 208v26" stroke="#20201D" strokeWidth="3" strokeLinecap="round" />
                  <path d="M321 221h50" stroke="#F5AE4D" strokeWidth="4" strokeLinecap="round" />
                </g>
              </svg>

              <span
                style={{
                  position: 'absolute',
                  borderRadius: '50%',
                  background: '#F5AE4D',
                  width: '12px',
                  height: '12px',
                  left: '1%',
                  top: '10%',
                }}
              />
              <span
                style={{
                  position: 'absolute',
                  borderRadius: '50%',
                  background: '#F5AE4D',
                  width: '7px',
                  height: '7px',
                  right: '17%',
                  bottom: '18%',
                }}
              />
            </div>
          </div>
        </section>

        {/* Right Auth Section with Widened Card */}
        <section
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '70px 24px 30px',
            boxSizing: 'border-box',
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '520px',
              background: '#FFFDF8',
              border: '1px solid #DDD9CC',
              borderRadius: '24px',
              padding: '44px 40px',
              boxShadow: '0 20px 60px rgba(35, 31, 20, 0.08)',
              boxSizing: 'border-box',
            }}
          >
            {/* Status Badge */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '7px',
                background: '#EEEADF',
                border: '1px solid #DDD9CC',
                padding: '6px 12px',
                borderRadius: '999px',
                fontSize: '11px',
                fontWeight: 700,
                marginBottom: '20px',
                color: '#20201D',
              }}
            >
              <b
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: '#719879',
                  display: 'inline-block',
                }}
              />
              Secure workspace access
            </div>

            <h2
              style={{
                fontSize: '30px',
                letterSpacing: '-0.04em',
                margin: '0 0 8px',
                fontWeight: 750,
                color: '#20201D',
              }}
            >
              Welcome back
            </h2>
            <p
              style={{
                fontSize: '14px',
                color: '#77756D',
                lineHeight: 1.55,
                margin: '0 0 28px',
              }}
            >
              Sign in to pick up where your team left off.
            </p>

            <form onSubmit={handleSubmit}>
              {/* Email Input */}
              <div style={{ marginBottom: '20px', width: '100%' }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: '13px',
                    fontWeight: 650,
                    marginBottom: '8px',
                    color: '#20201D',
                  }}
                >
                  Email
                </label>
                <input
                  type="email"
                  placeholder="you@company.com"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  style={{
                    display: 'block',
                    width: '100%',
                    height: '48px',
                    background: '#FFFDF8',
                    border: '1px solid #DDD9CC',
                    borderRadius: '12px',
                    padding: '0 16px',
                    fontSize: '14px',
                    color: '#20201D',
                    outline: 'none',
                    transition: 'border-color 0.2s ease-out, box-shadow 0.2s ease-out',
                    boxSizing: 'border-box',
                    fontFamily: 'inherit',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#F5AE4D';
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(245, 174, 77, 0.18)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '#DDD9CC';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                />
              </div>

              {/* Password Input */}
              <div style={{ marginBottom: '20px', width: '100%' }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: '13px',
                    fontWeight: 650,
                    marginBottom: '8px',
                    color: '#20201D',
                  }}
                >
                  Password
                </label>
                <div style={{ position: 'relative', width: '100%' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    style={{
                      display: 'block',
                      width: '100%',
                      height: '48px',
                      background: '#FFFDF8',
                      border: '1px solid #DDD9CC',
                      borderRadius: '12px',
                      padding: '0 48px 0 16px',
                      fontSize: '14px',
                      color: '#20201D',
                      outline: 'none',
                      transition: 'border-color 0.2s ease-out, box-shadow 0.2s ease-out',
                      boxSizing: 'border-box',
                      fontFamily: 'inherit',
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = '#F5AE4D';
                      e.currentTarget.style.boxShadow = '0 0 0 3px rgba(245, 174, 77, 0.18)';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = '#DDD9CC';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '14px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#77756D',
                      display: 'flex',
                      alignItems: 'center',
                      padding: '4px',
                    }}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Remember me & Forgot Password Row */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  margin: '14px 0 24px',
                  fontSize: '13px',
                }}
              >
                <label
                  style={{
                    display: 'flex',
                    gap: '8px',
                    alignItems: 'center',
                    color: '#77756D',
                    cursor: 'pointer',
                    margin: 0,
                    fontWeight: 500,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    style={{ accentColor: '#F5AE4D', width: '16px', height: '16px' }}
                  />
                  Remember me
                </label>
                <Link
                  to="/forgot-password"
                  style={{
                    color: '#20201D',
                    fontWeight: 650,
                    textDecoration: 'none',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#E99532')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = '#20201D')}
                >
                  Forgot password?
                </Link>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  display: 'block',
                  width: '100%',
                  height: '48px',
                  border: 0,
                  borderRadius: '12px',
                  background: '#F5AE4D',
                  color: '#20201D',
                  fontWeight: 750,
                  fontSize: '14px',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 4px 12px rgba(245, 174, 77, 0.3)',
                }}
                onMouseEnter={(e) => {
                  if (!isSubmitting) {
                    e.currentTarget.style.background = '#E99532';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSubmitting) {
                    e.currentTarget.style.background = '#F5AE4D';
                    e.currentTarget.style.transform = 'none';
                  }
                }}
              >
                {isSubmitting ? 'Signing in...' : 'Sign in to Syntrix'}
              </button>
            </form>

            {/* Divider */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                color: '#9A978D',
                fontSize: '12px',
                margin: '26px 0',
              }}
            >
              <div style={{ height: '1px', background: '#DDD9CC', flex: 1 }} />
              <span>or continue with</span>
              <div style={{ height: '1px', background: '#DDD9CC', flex: 1 }} />
            </div>

            {/* Social & 1-Click Demo Buttons */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '10px',
              }}
            >
              <button
                type="button"
                onClick={() => fillDemoAccount('alex@syntrix.io', 'Password123!')}
                style={{
                  border: '1px solid #DDD9CC',
                  background: '#FFFDF8',
                  borderRadius: '10px',
                  padding: '11px 8px',
                  fontSize: '12px',
                  fontWeight: 650,
                  cursor: 'pointer',
                  color: '#20201D',
                  transition: 'all 0.15s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '5px',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#EEEADF')}
                onMouseLeave={(e) => (e.currentTarget.style.background = '#FFFDF8')}
              >
                <span>G</span> Google
              </button>

              <button
                type="button"
                onClick={() => fillDemoAccount('sarah@syntrix.io', 'Password123!')}
                style={{
                  border: '1px solid #DDD9CC',
                  background: '#FFFDF8',
                  borderRadius: '10px',
                  padding: '11px 8px',
                  fontSize: '12px',
                  fontWeight: 650,
                  cursor: 'pointer',
                  color: '#20201D',
                  transition: 'all 0.15s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '5px',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#EEEADF')}
                onMouseLeave={(e) => (e.currentTarget.style.background = '#FFFDF8')}
              >
                <span>●</span> Apple
              </button>

              <button
                type="button"
                onClick={() => fillDemoAccount('alex@syntrix.io', 'Password123!')}
                style={{
                  border: '1px solid #F5AE4D',
                  background: '#FCE5C2',
                  borderRadius: '10px',
                  padding: '11px 8px',
                  fontSize: '12px',
                  fontWeight: 750,
                  cursor: 'pointer',
                  color: '#20201D',
                  transition: 'all 0.15s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '5px',
                }}
                title="Click to auto-fill demo account"
                onMouseEnter={(e) => (e.currentTarget.style.background = '#F5AE4D')}
                onMouseLeave={(e) => (e.currentTarget.style.background = '#FCE5C2')}
              >
                <Sparkles size={13} color="#20201D" />
                Demo
              </button>
            </div>

            {/* Bottom Register Link */}
            <p
              style={{
                textAlign: 'center',
                fontSize: '13px',
                color: '#77756D',
                margin: '26px 0 0',
              }}
            >
              New to Syntrix?{' '}
              <Link
                to="/register"
                style={{
                  fontWeight: 750,
                  color: '#20201D',
                  textDecoration: 'none',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#E99532')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#20201D')}
              >
                Create an account
              </Link>
            </p>

            {/* Terms Statement */}
            <div
              style={{
                fontSize: '11px',
                lineHeight: 1.5,
                color: '#9A978D',
                marginTop: '18px',
                textAlign: 'center',
              }}
            >
              By continuing, you agree to Syntrix's Terms of Service and Privacy Policy.
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Login;
