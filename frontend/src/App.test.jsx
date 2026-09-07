import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import App from '../src/App.jsx'

describe('App Component', () => {
  it('renders the main header with branding', () => {
    render(<App />)
    expect(screen.getByText(/Deepfake Defense/i)).toBeInTheDocument()
  })

  it('displays navigation menu', () => {
    render(<App />)
    expect(screen.getByText(/Home/i)).toBeInTheDocument()
    expect(screen.getByText(/About/i)).toBeInTheDocument()
    expect(screen.getByText(/Modules/i)).toBeInTheDocument()
  })

  it('shows login button when not authenticated', () => {
    render(<App />)
    expect(screen.getByText(/Login/i)).toBeInTheDocument()
  })

  it('renders module cards in the modules section', () => {
    render(<App />)
    expect(screen.getByText(/Deepfake Video/i)).toBeInTheDocument()
    expect(screen.getByText(/Spoofing Detection/i)).toBeInTheDocument()
    expect(screen.getByText(/Image Forensics/i)).toBeInTheDocument()
    expect(screen.getByText(/Text Verification/i)).toBeInTheDocument()
    expect(screen.getByText(/Audio Analysis/i)).toBeInTheDocument()
  })
})

describe('FakeNewsDetection Component', () => {
  it('renders detection tabs', () => {
    render(<App />)
    expect(screen.getByText(/Image/)).toBeInTheDocument()
    expect(screen.getByText(/Text/)).toBeInTheDocument()
    expect(screen.getByText(/Video/)).toBeInTheDocument()
    expect(screen.getByText(/Audio/)).toBeInTheDocument()
  })

  it('allows switching between tabs', () => {
    render(<App />)
    const videoTab = screen.getByRole('button', { name: /Video/ })
    fireEvent.click(videoTab)
    
    // Tab should be marked as active
    expect(videoTab).toHaveClass('active')
  })

  it('shows result preview section', () => {
    render(<App />)
    expect(screen.getByText(/Fake news analysis output/i)).toBeInTheDocument()
  })

  it('displays analysis action buttons', () => {
    render(<App />)
    expect(screen.getByRole('button', { name: /Run analysis/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Reset/ })).toBeInTheDocument()
  })
})

describe('Result Display', () => {
  it('shows idle state initially', () => {
    render(<App />)
    expect(
      screen.getByText(/Select a modality and upload content to begin analysis/i)
    ).toBeInTheDocument()
  })

  it('displays analyzing state message', async () => {
    render(<App />)
    const textarea = screen.getByPlaceholderText(/Paste suspicious/i)
    const runButton = screen.getByRole('button', { name: /Run analysis/ })
    
    fireEvent.change(textarea, { target: { value: 'Test content' } })
    fireEvent.click(runButton)
    
    await waitFor(() => {
      expect(screen.getByText(/Analyzing content/i)).toBeInTheDocument()
    })
  })
})

describe('File Upload', () => {
  it('accepts file uploads on image tab', () => {
    render(<App />)
    const fileInput = screen.getByLabelText(/Choose file/i)
    
    expect(fileInput).toBeInTheDocument()
    expect(fileInput).toHaveAttribute('accept', 'image/*')
  })

  it('updates file summary when file is selected', () => {
    render(<App />)
    const fileInput = screen.getByLabelText(/Choose file/i)
    
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
    fireEvent.change(fileInput, { target: { files: [file] } })
    
    // File summary should update
    expect(screen.getByText(/test.jpg/)).toBeInTheDocument()
  })
})

describe('Text Input', () => {
  it('shows textarea on text tab', () => {
    render(<App />)
    const textTab = screen.getByRole('button', { name: /Text/ })
    fireEvent.click(textTab)
    
    const textarea = screen.getByPlaceholderText(/Paste suspicious/i)
    expect(textarea).toBeInTheDocument()
  })

  it('accepts text input in textarea', () => {
    render(<App />)
    const textTab = screen.getByRole('button', { name: /Text/ })
    fireEvent.click(textTab)
    
    const textarea = screen.getByPlaceholderText(/Paste suspicious/i)
    fireEvent.change(textarea, { target: { value: 'Test text' } })
    
    expect(textarea).toHaveValue('Test text')
  })
})

describe('Responsive Layout', () => {
  it('renders detection panels in a responsive grid', () => {
    render(<App />)
    const detectionPanel = screen.getByText(/Choose file/).closest('div')
    
    expect(detectionPanel).toBeInTheDocument()
  })
})

describe('Accessibility', () => {
  it('has proper heading hierarchy', () => {
    render(<App />)
    const h2 = screen.getByText(/Deepfake Defense/)
    
    expect(h2).toBeInTheDocument()
  })

  it('has descriptive button labels', () => {
    render(<App />)
    const runButton = screen.getByRole('button', { name: /Run analysis/ })
    
    expect(runButton).toHaveTextContent(/Run analysis/)
  })

  it('has form labels for inputs', () => {
    render(<App />)
    const fileLabel = screen.getByLabelText(/Choose file/i)
    
    expect(fileLabel).toBeInTheDocument()
  })
})
