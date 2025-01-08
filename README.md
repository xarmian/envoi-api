# enVoi API

The enVoi API provides resolution and search services for VOI (.voi) names and addresses. For API documentation and usage, visit [api.envoi.sh](https://api.envoi.sh).

## Running Your Own Instance

### Prerequisites

- Node.js 18 or later
- Mimir (https://github.com/cswenor/mimir)
- Mimir Functions (not yet documented)

### Setup

1. Clone the repository:
```bash
git clone https://github.com/xarmian/envoi-api.git
cd envoi-api
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory:
```bash
PUBLIC_SUPABASE_URL=https://envoi.supabase.co
PUBLIC_SUPABASE_ANON_KEY=
```

4. Configure Mimir (not yet documented)

5. Start the development server:
```bash
npm run dev
```

The API will be available at `http://localhost:3000`.

### Production Deployment

For production deployment:

1. Build the application:
```bash
npm run build
```

2. Start the production server:
```bash
npm start
```

Consider using a process manager like PM2 for production deployments:
```bash
npm install -g pm2
pm2 start build/index.js --name envoi-api
```

## Contributing

We welcome contributions! Here's how you can help:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests (`npm test`)
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

### Development Guidelines

- Follow the existing code style
- Add tests for new features
- Update documentation as needed
- Keep commits focused and atomic

### Testing

Run the test suite:
```bash
npm test
```

Run tests in watch mode during development:
```bash
npm run test:watch
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
