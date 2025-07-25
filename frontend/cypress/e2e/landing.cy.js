describe('Landing Page', () => {
  it('debe mostrar el título principal', () => {
    cy.visit('http://localhost:5173/');
    cy.contains(/BrainSafes|Bienvenido|Welcome/i);
  });
}); 