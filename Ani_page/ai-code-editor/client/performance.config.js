// Performance Optimizations 
module.exports = { 
  chunkSizeWarningLimit: 1000, 
  splitChunks: { 
    chunks: 'all', 
    cacheGroups: { 
      vendor: { name: 'vendor', chunks: 'all', test: /node_modules/ }, 
      codemirror: { name: 'codemirror', chunks: 'all', test: /@codemirror/ } 
    } 
  } 
}; 

