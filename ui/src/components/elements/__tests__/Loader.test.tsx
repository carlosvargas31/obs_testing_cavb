import React from 'react';
import { render, screen } from '@testing-library/react';
import Loader from '../Loader';

// Mock the SVG image
jest.mock('../loader.svg', () => 'loader.svg');

describe('Loader Component', () => {
  describe('Renderizado del mensaje', () => {
    it('should render the message prop correctly', () => {
      const testMessage = 'Loading data...';
      render(<Loader message={testMessage} />);

      const message = screen.getByText(testMessage);
      expect(message).toBeInTheDocument();
    });

    it('should render different messages based on prop', () => {
      const { rerender } = render(<Loader message="First message" />);
      expect(screen.getByText('First message')).toBeInTheDocument();

      rerender(<Loader message="Second message" />);
      expect(screen.getByText('Second message')).toBeInTheDocument();
    });

    it('should render message with special characters', () => {
      const messageWithSpecialChars = 'Loading... @#$%^&*()';
      render(<Loader message={messageWithSpecialChars} />);

      expect(screen.getByText(messageWithSpecialChars)).toBeInTheDocument();
    });

    it('should render long message correctly', () => {
      const longMessage =
        'This is a very long loading message that should be displayed correctly on the screen';
      render(<Loader message={longMessage} />);

      expect(screen.getByText(longMessage)).toBeInTheDocument();
    });
  });

  describe('Renderizado de la imagen', () => {
    it('should render loader image', () => {
      const testMessage = 'Loading...';
      render(<Loader message={testMessage} />);

      const image = screen.getByRole('img');
      expect(image).toBeInTheDocument();
    });

    it('should have correct alt text from message prop', () => {
      const testMessage = 'Please wait';
      render(<Loader message={testMessage} />);

      const image = screen.getByAltText(testMessage);
      expect(image).toBeInTheDocument();
    });

    it('should have src attribute pointing to loader image', () => {
      render(<Loader message="Loading" />);

      const image = screen.getByRole('img') as HTMLImageElement;
      expect(image.src).toBeDefined();
    });

    it('should update alt text when message prop changes', () => {
      const { rerender } = render(<Loader message="First" />);
      expect(screen.getByAltText('First')).toBeInTheDocument();

      rerender(<Loader message="Second" />);
      expect(screen.getByAltText('Second')).toBeInTheDocument();
      expect(screen.queryByAltText('First')).not.toBeInTheDocument();
    });

    it('should render img as child of LoaderCard', () => {
      const testMessage = 'Loading...';
      const { container } = render(<Loader message={testMessage} />);

      const images = container.querySelectorAll('img');
      expect(images.length).toBe(1);
      expect(images[0]).toHaveAttribute('alt', testMessage);
    });
  });

  describe('Comportamiento con diferentes props', () => {
    it('should accept and render string prop', () => {
      render(<Loader message="Test" />);
      expect(screen.getByText('Test')).toBeInTheDocument();
    });

    it('should handle message with numbers', () => {
      const message = 'Loading 123 items...';
      render(<Loader message={message} />);
      expect(screen.getByText(message)).toBeInTheDocument();
    });

    it('should handle message with line breaks', () => {
      const message = 'Loading\nPlease wait';
      render(<Loader message={message} />);
      // The message might be rendered with the newline preserved or converted
      expect(screen.getByText(/Loading/)).toBeInTheDocument();
    });

    it('should handle message with unicode characters', () => {
      const message = 'Cargando... 🔄 ⏳';
      render(<Loader message={message} />);
      expect(screen.getByText(message)).toBeInTheDocument();
    });

    it('should render with minimal message', () => {
      render(<Loader message="a" />);
      expect(screen.getByText('a')).toBeInTheDocument();
    });
  });

  describe('Estructura del DOM', () => {
    it('should have correct DOM structure', () => {
      const { container } = render(<Loader message="Loading" />);

      // Check for LoaderWrapper
      const wrapper = container.firstChild;
      expect(wrapper).toBeInTheDocument();

      // Check for LoaderCard inside wrapper
      const card = wrapper?.firstChild;
      expect(card).toBeInTheDocument();

      // Check for image and message inside card
      const children = card?.childNodes;
      expect(children?.length).toBe(2);
    });

    it('should have LoaderWrapper as direct child of container', () => {
      const { container } = render(<Loader message="Loading" />);
      const root = container.firstChild;
      expect(root).toBeInTheDocument();
    });

    it('should render as a single root element', () => {
      const { container } = render(<Loader message="Loading" />);
      expect(container.children.length).toBe(1);
    });

    it('should have proper nesting hierarchy', () => {
      const { container } = render(<Loader message="Test" />);

      // Get the wrapper (LoaderWrapper)
      const wrapper = container.querySelector('div:first-child') as HTMLElement;
      expect(wrapper).toBeDefined();

      // Get all direct divs inside wrapper
      const allDivs = wrapper?.querySelectorAll(':scope > div');
      expect(allDivs?.length).toBeGreaterThanOrEqual(1);
    });

    it('should have image and message as siblings', () => {
      const { container } = render(<Loader message="Loading" />);

      const image = container.querySelector('img');
      const card = image?.parentElement;

      // Both image and message should be direct children of the same parent
      expect(card?.children.length).toBe(2);
      expect(card?.children[0]).toBe(image);
    });
  });
});
