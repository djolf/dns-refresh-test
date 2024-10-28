import fs from 'fs';
import fetch from 'cross-fetch';
import { readHostnamesFile, getDnsRecord, dnsRefresh, exportListToFile, dnsList, IPStatus } from '../index';

jest.mock('cross-fetch');
jest.mock('fs');
jest.mock('readline', () => {
  return {
    createInterface: jest.fn().mockReturnValue({
      question: jest.fn((_, cb) => cb('')),
      close: jest.fn()
    }),
  };
});

const { Response } = jest.requireActual('cross-fetch');

const sampleDnsResponse = {
  Answer: [
    { data: '8.8.8.8' },
    { data: '8.8.4.4' }
  ]
};

const mockHostnames = ['google.com', 'youtube.com'];

describe('DNS Refresh Tests', () => {

  beforeEach(() => {
    // clear dnsList before each test
    for (let key in dnsList) delete dnsList[key];
  });

  describe('readHostnamesFile', () => {
    it('should load hostnames from a file into dnsList', async () => {
      const mockFileContent = JSON.stringify(mockHostnames);
      jest.spyOn(fs, 'readFileSync').mockReturnValue(mockFileContent);

      await readHostnamesFile('hostnames.json');

      expect(dnsList['google.com']).toEqual([]);
      expect(dnsList['youtube.com']).toEqual([]);
    });
  });

  describe('getDnsRecord', () => {
    it('should add active IPs to dnsList and mark old ones as hanging', async () => {
      dnsList['google.com'] = [
        { address: '8.8.8.8', status: IPStatus.HANGING, hangingCount: 1 }
      ];

      (fetch as jest.MockedFunction<typeof fetch>).mockImplementation(() =>
        Promise.resolve(new Response(JSON.stringify(sampleDnsResponse)))
      );

      await getDnsRecord('google.com');

      expect(dnsList['google.com']).toContainEqual({
        address: '8.8.8.8',
        status: IPStatus.ACTIVE,
        hangingCount: 0
      });
      expect(dnsList['google.com']).toContainEqual({
        address: '8.8.4.4',
        status: IPStatus.ACTIVE,
        hangingCount: 0
      });
    });
  });

  describe('dnsRefresh', () => {
    it('should refresh DNS for all hostnames in dnsList', async () => {
      dnsList['google.com'] = [];
      dnsList['youtube.com'] = [];

      (fetch as jest.MockedFunction<typeof fetch>).mockImplementation(() =>
        Promise.resolve(new Response(JSON.stringify(sampleDnsResponse)))
      );

      await dnsRefresh();

      expect(dnsList['google.com']).toHaveLength(2);
      expect(dnsList['youtube.com']).toHaveLength(2);
    });

    it('should remove dns record with hangingCount 3', async () => {
      dnsList['google.com'] = [
        { address: '8.8.8.8', status: IPStatus.HANGING, hangingCount: 3 },
        { address: '8.8.4.4', status: IPStatus.ACTIVE, hangingCount: 0 }
      ];

      (fetch as jest.MockedFunction<typeof fetch>).mockImplementation(() =>
        Promise.resolve(new Response(JSON.stringify({ Answer: [{ data: '8.8.4.4' }] })))
      );

      await dnsRefresh();

      // Verify that IP with hangingCount 3 is removed
      expect(dnsList['google.com']).not.toContainEqual({
        address: '8.8.8.8',
        status: IPStatus.HANGING,
        hangingCount: 3
      });

      // Verify that the active IP remains
      expect(dnsList['google.com']).toContainEqual({
        address: '8.8.4.4',
        status: IPStatus.ACTIVE,
        hangingCount: 0
      });
    });
  });

  describe('exportListToFile', () => {
    it('should export dnsList to a JSON file', async () => {
      dnsList['google.com'] = [
        { address: '8.8.8.8', status: IPStatus.ACTIVE, hangingCount: 0 },
        { address: '8.8.4.4', status: IPStatus.HANGING, hangingCount: 2 }
      ];

      const writeFileSyncMock = jest.spyOn(fs, 'writeFileSync').mockImplementation();

      await exportListToFile('test_export.json');

      expect(writeFileSyncMock).toHaveBeenCalledWith(
        'exported/test_export.json',
        JSON.stringify(dnsList, null, 2)
      );
    });
  });
});
