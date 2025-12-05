import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import AboutMeCard from '../AboutMeCard';
import { AboutMe } from '../../../model/aboutme';

// Mock react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'aboutMeCard.name': 'Name',
        'aboutMeCard.birthdate': 'Birthdate',
        'aboutMeCard.nationality': 'Nationality',
        'aboutMeCard.occupation': 'Occupation',
        'aboutMeCard.github': 'GitHub'
      };
      return translations[key] || key;
    }
  })
}));

// Mock the avatar image
jest.mock('../Avatar.jpg', () => 'mocked-avatar.jpg');

describe('AboutMeCard Component', () => {
  const mockAboutMe: AboutMe = {
    _id: 'aboutme-123',
    name: 'John Doe',
    birthday: 631152000,
    nationality: 'USA',
    job: 'Software Developer',
    github: 'https://github.com/johndoe'
  };

  test('renders name from aboutMe data', () => {
    render(<AboutMeCard aboutMe={mockAboutMe} />);
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  test('renders all optional fields when provided', () => {
    render(<AboutMeCard aboutMe={mockAboutMe} />);
    expect(screen.getByText('1/8/1970')).toBeInTheDocument();
    expect(screen.getByText('USA')).toBeInTheDocument();
    expect(screen.getByText('Software Developer')).toBeInTheDocument();
  });

  test('does not render optional fields when not provided', () => {
    const minimalAboutMe: AboutMe = {
      _id: 'aboutme-456',
      name: 'Jane Smith'
    };
    render(<AboutMeCard aboutMe={minimalAboutMe} />);
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    expect(screen.queryByText('1/8/1970')).not.toBeInTheDocument();
  });

  test('renders GitHub link when provided', () => {
    render(<AboutMeCard aboutMe={mockAboutMe} />);
    expect(screen.getByText('https://github.com/johndoe')).toBeInTheDocument();
  });

  test('renders avatar image with correct attributes', () => {
    const { container } = render(<AboutMeCard aboutMe={mockAboutMe} />);
    const image = container.querySelector('img');
    expect(image).toBeInTheDocument();
  });
});
