// JavaScript para el custom select
document.addEventListener('DOMContentLoaded', function() {
  const customSelect = document.getElementById('custom_property_type');
  const hiddenSelect = document.getElementById('property_type');
  
  // Verificar que los elementos existen
  if (!customSelect || !hiddenSelect) {
    console.error('No se encontraron los elementos del select');
    return;
  }
  
  const trigger = customSelect.querySelector('.custom-select__trigger');
  const options = customSelect.querySelectorAll('.custom-option');
  const triggerText = trigger.querySelector('span');
  
  trigger.addEventListener('click', function(e) {
    e.stopPropagation();
    customSelect.classList.toggle('open');
  });
  
  options.forEach(option => {
    option.addEventListener('click', function() {
      const value = this.getAttribute('data-value');
      const text = this.textContent;
      
      // Actualizar trigger visual
      triggerText.textContent = text;
      
      // Actualizar select oculto (IMPORTANTE: esto es lo que envía el formulario)
      hiddenSelect.value = value;
      
      // Marcar como seleccionado
      options.forEach(opt => opt.classList.remove('selected'));
      this.classList.add('selected');
      
      // Cerrar dropdown
      customSelect.classList.remove('open');
      
      // Disparar evento change para validaciones
      const changeEvent = new Event('change', { bubbles: true });
      hiddenSelect.dispatchEvent(changeEvent);
      
      console.log('Valor seleccionado:', value, 'Select oculto value:', hiddenSelect.value);
    });
  });
  
  // Cerrar al hacer click fuera
  document.addEventListener('click', function(e) {
    if (!customSelect.contains(e.target)) {
      customSelect.classList.remove('open');
    }
  });
});