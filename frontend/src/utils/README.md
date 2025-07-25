# Utils de Integración Frontend-Backend

## Contratos inteligentes (`contract.js`)

```js
import { getContract } from "./contract";
import { ethers } from "ethers";

const provider = new ethers.providers.Web3Provider(window.ethereum);
const contract = getContract(provider);
// Ejemplo: obtener balance
const balance = await contract.balanceOf("0x123...");
```

## Backend API (`api.js`)

```js
import { getUser, createPayment } from "./api";

const user = await getUser("userId");
const payment = await createPayment({ amount: 100, userId: "userId" });
```

## Ejemplo de hooks

### Obtener balance de contrato
```js
import { useContractBalance } from "../hooks/useContractBalance";
const balance = useContractBalance(address);
```

### Obtener usuario del backend
```js
import { useUser } from "../hooks/useUser";
const { user, loading, error } = useUser(userId);
``` 

---

## 1. Crea una carpeta para tests

Por convención, puedes crear:  
`frontend/src/components/__tests__/`

---

## 2. Crea un test de ejemplo para un componente

Por ejemplo, para el componente `Landing.jsx`:

Crea el archivo:  
`frontend/src/components/__tests__/Landing.test.jsx`

```jsx
import { render, screen } from '@testing-library/react';
import Landing from '../Landing';

describe('Landing', () => {
  it('renderiza el título principal', () => {
    // Cambia el texto según lo que muestre tu componente
    render(<Landing />);
    expect(
      screen.getByText(/Bienvenido|Welcome|Inicio|Landing/i)
    ).toBeInTheDocument();
  });
});
```

---

## 3. Ejecuta de nuevo la cobertura

```bash
npx vitest run --coverage
```

Ahora deberías ver un reporte con cobertura distinta de cero para `Landing.jsx`.

---

## 4. ¿Quieres más ejemplos?

Pídeme tests para cualquier componente, hook o utilidad y te los genero listos para usar.

---

### Resumen

- La cobertura está bien configurada.
- Solo necesitas agregar archivos de test (`*.test.jsx`, `*.test.js`, etc.).
- Cada test que agregues aumentará la cobertura y la calidad de tu código.

¿Te genero más tests de ejemplo para otros componentes o hooks? ¿Quieres una plantilla para tus utilidades?  
¡Dímelo y te lo hago en español y listo para copiar y pegar! 