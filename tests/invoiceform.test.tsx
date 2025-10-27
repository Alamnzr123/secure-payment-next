import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import InvoiceForm from '../src/components/InvoiceForm';

describe('InvoiceForm', () => {
  it('shows required errors when submitting empty required fields', async () => {
    render(<InvoiceForm />);
    const submit = screen.getByRole('button', { name: /create invoice/i });
    fireEvent.click(submit);

    // react-hook-form shows generic error container when fields invalid
    const err = await screen.findByText(/Please fix the errors./i);
    expect(err).toBeTruthy();
  });
});
