import { useState } from 'react';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import ShowChartRoundedIcon from '@mui/icons-material/ShowChartRounded';
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded';
import VisibilityOffRoundedIcon from '@mui/icons-material/VisibilityOffRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import RadioButtonUncheckedRoundedIcon from '@mui/icons-material/RadioButtonUncheckedRounded';
import ErrorOutlineRoundedIcon from '@mui/icons-material/ErrorOutlineRounded';
import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded';
import { signInWithEmail, signUpWithEmail, signInWithGoogle } from '../../services/supabase.js';
import googleIcon from '../../assets/google.svg';
import traxiom from '../../assets/traxiom.svg';

const fieldSx = {
  '& .MuiOutlinedInput-root': {
    backgroundColor: '#faf9ff',
    borderRadius: '8px',
    '& fieldset': { borderColor: '#ddd6fe' },
    '&:hover fieldset': { borderColor: '#c4b5fd' },
  },
  '& .MuiInputBase-input': { color: '#1e1b4b', fontSize: '0.9375rem' },
  '& .MuiInputLabel-root': { color: '#6b7280', fontSize: '0.8rem' },
  '& .MuiInputLabel-shrink': { fontSize: '0.75rem' },
};

function Requirement({ met, label }) {
  return (
    <li className={`tt-login__req-item ${met ? 'tt-login__req-item--met' : ''}`}>
      {met
        ? <CheckCircleRoundedIcon sx={{ fontSize: 14 }} />
        : <RadioButtonUncheckedRoundedIcon sx={{ fontSize: 14 }} />
      }
      {label}
    </li>
  );
}

export default function Login() {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const requirements = [
    { label: 'Mínimo 8 caracteres', met: password.length >= 8 },
    { label: 'Al menos una mayúscula', met: /[A-Z]/.test(password) },
    { label: 'Al menos una minúscula', met: /[a-z]/.test(password) },
    { label: 'Al menos un número', met: /\d/.test(password) },
    { label: 'Las contraseñas coinciden', met: password === confirm && confirm.length > 0 },
  ];

  const allRequirementsMet = requirements.every((r) => r.met);

  function switchMode(next) {
    setMode(next);
    setError('');
    setMessage('');
    setPassword('');
    setConfirm('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      if (mode === 'login') {
        await signInWithEmail(email, password);
      } else {
        await signUpWithEmail(email, password);
        setMessage('Revisa tu correo para confirmar tu cuenta.');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setError('');
    try {
      await signInWithGoogle();
    } catch (err) {
      setError(err.message);
    }
  }

  const canSubmit = mode === 'login' ? (email && password) : (email && allRequirementsMet);

  return (
    <div className="tt-login">
      <div className="tt-login__card">

        <div className="tt-login__brand">
          <div className="tt-login__brand-icon">
            <img src={traxiom} alt="Traxiom" />
          </div>
          <h1 className="tt-login__title">Trading Tracker</h1>
          <p className="tt-login__subtitle">Controla cada operación</p>
        </div>

        <div className="tt-login__tabs">
          <button
            className={`tt-login__tab ${mode === 'login' ? 'tt-login__tab--active' : ''}`}
            onClick={() => switchMode('login')}
          >
            Iniciar sesión
          </button>
          <button
            className={`tt-login__tab ${mode === 'register' ? 'tt-login__tab--active' : ''}`}
            onClick={() => switchMode('register')}
          >
            Registrarse
          </button>
        </div>

        <form className="tt-login__form" onSubmit={handleSubmit} noValidate>

          <TextField
            label="Correo electrónico"
            type="email"
            fullWidth
            size="small"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            sx={fieldSx}
          />

          <TextField
            label="Contraseña"
            type={showPass ? 'text' : 'password'}
            fullWidth
            size="small"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            sx={fieldSx}
            slotProps={{
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPass((v) => !v)}
                      edge="end"
                      size="small"
                      tabIndex={-1}
                      sx={{ color: '#9ca3af' }}
                    >
                      {showPass
                        ? <VisibilityOffRoundedIcon sx={{ fontSize: 18 }} />
                        : <VisibilityRoundedIcon sx={{ fontSize: 18 }} />
                      }
                    </IconButton>
                  </InputAdornment>
                ),
              },
            }}
          />

          {mode === 'register' && (
            <>
              <TextField
                label="Confirmar contraseña"
                type={showConfirm ? 'text' : 'password'}
                fullWidth
                size="small"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                autoComplete="new-password"
                sx={fieldSx}
                slotProps={{
                  input: {
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowConfirm((v) => !v)}
                          edge="end"
                          size="small"
                          tabIndex={-1}
                          sx={{ color: '#9ca3af' }}
                        >
                          {showConfirm
                            ? <VisibilityOffRoundedIcon sx={{ fontSize: 18 }} />
                            : <VisibilityRoundedIcon sx={{ fontSize: 18 }} />
                          }
                        </IconButton>
                      </InputAdornment>
                    ),
                  },
                }}
              />

              <ul className="tt-login__requirements">
                {requirements.map((r) => (
                  <Requirement key={r.label} met={r.met} label={r.label} />
                ))}
              </ul>
            </>
          )}

          {error && (
            <div className="tt-login__alert tt-login__alert--error">
              <ErrorOutlineRoundedIcon sx={{ fontSize: 16 }} />
              {error}
            </div>
          )}

          {message && (
            <div className="tt-login__alert tt-login__alert--success">
              <CheckCircleOutlineRoundedIcon sx={{ fontSize: 16 }} />
              {message}
            </div>
          )}

          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            disabled={loading || !canSubmit}
            sx={{
              borderRadius: '8px',
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '0.9375rem',
              py: '0.65rem',
              boxShadow: 'none',
              '&:hover': { boxShadow: 'none' },
            }}
          >
            {loading ? 'Cargando...' : mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
          </Button>
        </form>

        <div className="tt-login__divider">
          <span>o continúa con</span>
        </div>

        <button className="tt-login__btn-google" type="button" onClick={handleGoogle}>
          <img src={googleIcon} alt="Google" />
          Continuar con Google
        </button>

      </div>
    </div>
  );
}
