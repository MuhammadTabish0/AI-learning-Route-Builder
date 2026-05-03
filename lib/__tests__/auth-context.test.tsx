/**
 * @jest-environment jsdom
 */
import React from 'react'
import { render, screen, act } from '@testing-library/react'
import { AuthProvider, useAuth } from '../auth-context'

// A small component to test the useAuth hook
const TestComponent = () => {
  const { user, isAuthenticated, login, logout, checkAuth, initialized } = useAuth()
  
  return (
    <div>
      <div data-testid="initialized">{initialized ? 'true' : 'false'}</div>
      <div data-testid="isAuthenticated">{isAuthenticated ? 'true' : 'false'}</div>
      <div data-testid="username">{user?.username}</div>
      <button onClick={() => login({ username: 'Ali', email: 'ali@test.com', accountType: 'student', subscriptionPlan: 'free' })} data-testid="login">Login</button>
      <button onClick={() => logout()} data-testid="logout">Logout</button>
      <button onClick={() => checkAuth()} data-testid="checkAuth">Check</button>
    </div>
  )
}

describe('AuthContext', () => {
  beforeEach(() => {
    localStorage.clear()
    jest.clearAllMocks()
  })

  it('UT-011: Throws error when useAuth is used outside AuthProvider', () => {
    // Suppress console.error for expected thrown error
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => render(<TestComponent />)).toThrow('useAuth must be used within an AuthProvider')
    spy.mockRestore()
  })

  it('UT-012: Provides default unauthenticated state initially', () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )
    
    expect(screen.getByTestId('initialized').textContent).toBe('true')
    expect(screen.getByTestId('isAuthenticated').textContent).toBe('false')
    expect(screen.getByTestId('username').textContent).toBe('')
  })

  it('UT-013: Initializes and reads from localStorage successfully', () => {
    localStorage.setItem('currentUser', JSON.stringify({ username: 'StoredUser', email: 'stored@test.com', accountType: 'admin', subscriptionPlan: 'pro' }))
    
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    expect(screen.getByTestId('isAuthenticated').textContent).toBe('true')
    expect(screen.getByTestId('username').textContent).toBe('StoredUser')
  })

  it('UT-014: Fails gracefully when localStorage contains invalid JSON', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
    localStorage.setItem('currentUser', 'not-valid-json')
    
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    expect(screen.getByTestId('isAuthenticated').textContent).toBe('false')
    expect(consoleSpy).toHaveBeenCalledWith(
      'Failed to load user from storage',
      expect.any(SyntaxError)
    )
    consoleSpy.mockRestore()
  })

  it('UT-015: login() updates context and saves to localStorage', () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    expect(screen.getByTestId('isAuthenticated').textContent).toBe('false')
    
    act(() => {
      screen.getByTestId('login').click()
    })

    expect(screen.getByTestId('isAuthenticated').textContent).toBe('true')
    expect(screen.getByTestId('username').textContent).toBe('Ali')
    
    const storedUser = JSON.parse(localStorage.getItem('currentUser')!)
    expect(storedUser.username).toBe('Ali')
  })

  it('UT-016: logout() clears context and removes from localStorage', () => {
    localStorage.setItem('currentUser', JSON.stringify({ username: 'ToLogout', email: 'a@b.c', accountType: 'student', subscriptionPlan: 'free' }))
    
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    expect(screen.getByTestId('isAuthenticated').textContent).toBe('true')
    expect(screen.getByTestId('username').textContent).toBe('ToLogout')

    act(() => {
      screen.getByTestId('logout').click()
    })

    expect(screen.getByTestId('isAuthenticated').textContent).toBe('false')
    expect(screen.getByTestId('username').textContent).toBe('')
    expect(localStorage.getItem('currentUser')).toBeNull()
  })

  it('UT-017: Responds to storage events correctly', () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    expect(screen.getByTestId('isAuthenticated').textContent).toBe('false')

    act(() => {
      localStorage.setItem('currentUser', JSON.stringify({ username: 'TabEvent', email: 'tab@x.y', accountType: 'student', subscriptionPlan: 'free' }))
      window.dispatchEvent(new Event('storage'))
    })

    expect(screen.getByTestId('isAuthenticated').textContent).toBe('true')
    expect(screen.getByTestId('username').textContent).toBe('TabEvent')
  })

  it('UT-018: Responds to custom auth-update events correctly', () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    act(() => {
      localStorage.setItem('currentUser', JSON.stringify({ username: 'CustomEvent', email: 'a@b.c', accountType: 'admin', subscriptionPlan: 'free' }))
      window.dispatchEvent(new Event('auth-update'))
    })

    expect(screen.getByTestId('username').textContent).toBe('CustomEvent')
  })
})
