// Custom error classes for blockchain operations
export class BlockchainError extends Error {
  constructor(message, code, details = {}) {
    super(message);
    this.name = 'BlockchainError';
    this.code = code;
    this.details = details;
  }
}

export class WalletError extends BlockchainError {
  constructor(message, details) {
    super(message, 'WALLET_ERROR', details);
    this.name = 'WalletError';
  }
}

export class ContractError extends BlockchainError {
  constructor(message, details) {
    super(message, 'CONTRACT_ERROR', details);
    this.name = 'ContractError';
  }
}

export class NetworkError extends BlockchainError {
  constructor(message, details) {
    super(message, 'NETWORK_ERROR', details);
    this.name = 'NetworkError';
  }
}

export class ValidationError extends BlockchainError {
  constructor(message, details) {
    super(message, 'VALIDATION_ERROR', details);
    this.name = 'ValidationError';
  }
}

// Error parser for ethers.js errors
export const parseEthersError = (error) => {
  if (!error) return { message: 'Unknown error', code: 'UNKNOWN' };

  // User rejected transaction
  if (error.code === 4001 || error.code === 'ACTION_REJECTED') {
    return {
      message: 'Transaction rejected by user',
      code: 'USER_REJECTED',
      userFriendly: true
    };
  }

  // Insufficient funds
  if (error.code === 'INSUFFICIENT_FUNDS' || error.message?.includes('insufficient funds')) {
    return {
      message: 'Insufficient funds for transaction',
      code: 'INSUFFICIENT_FUNDS',
      userFriendly: true
    };
  }

  // Network errors
  if (error.code === 'NETWORK_ERROR' || error.message?.includes('network')) {
    return {
      message: 'Network connection issue. Please check your connection',
      code: 'NETWORK_ERROR',
      userFriendly: true
    };
  }

  // Contract revert
  if (error.code === 'CALL_EXCEPTION') {
    const reason = error.reason || error.data?.message || 'Contract execution failed';
    return {
      message: `Transaction failed: ${reason}`,
      code: 'CONTRACT_REVERT',
      reason,
      userFriendly: true
    };
  }

  // Timeout
  if (error.message?.includes('timeout') || error.message?.includes('Timeout')) {
    return {
      message: 'Request timed out. Please try again',
      code: 'TIMEOUT',
      userFriendly: true
    };
  }

  // Default
  return {
    message: error.message || 'An unexpected error occurred',
    code: error.code || 'UNKNOWN',
    userFriendly: false
  };
};
