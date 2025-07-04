import asyncio
import websockets
import json
import hashlib
import datetime
import pandas as pd
import numpy as np
from collections import defaultdict
from scipy.stats import chisquare, kstest, binom_test
import matplotlib.pyplot as plt
from matplotlib.colors import LinearSegmentedColormap
import time
import os

class RugsTimeSeedAnalyzer:
    """
    A specialized analyzer for detecting time-based seed generation in Rugs.fun games.
    This focuses specifically on detecting patterns in server seed generation that
    might be correlated with timestamps.
    """
    
    def __init__(self, websocket_url=None, data_path=None):
        """
        Initialize with either a WebSocket URL for live data collection
        or a path to previously collected data.
        
        Parameters:
            websocket_url (str): WebSocket URL for Rugs.fun
            data_path (str): Path to JSON/JSONL file with historical game data
        """
        self.websocket_url = websocket_url
        self.data_path = data_path
        self.games = []
        self.current_game = None
        self.connection_active = False
        
        # Analysis results storage
        self.time_patterns = defaultdict(list)
        self.hash_candidates = []
        self.bit_patterns = {}
        
    async def connect(self):
        """Establish WebSocket connection to Rugs.fun"""
        try:
            self.connection = await websockets.connect(self.websocket_url)
            self.connection_active = True
            print("Connected to Rugs.fun WebSocket")
            return True
        except Exception as e:
            print(f"Connection error: {e}")
            return False
    
    async def collect_data(self, max_games=1000):
        """
        Collect seed and timestamp data from live games.
        
        Parameters:
            max_games (int): Maximum number of games to collect
        """
        if not self.connection_active:
            success = await self.connect()
            if not success:
                return
        
        game_count = 0
        
        try:
            while game_count < max_games:
                message = await self.connection.recv()
                data = json.loads(message)
                
                # Process different event types
                if 'type' in data:
                    if data['type'] == 'gameStateUpdate':
                        state = data.get('state', {})
                        
                        # New game started
                        if state.get('status') == 'playing' and not self.current_game:
                            self.current_game = {
                                'gameId': state.get('gameId'),
                                'serverSeedHash': state.get('serverSeedHash'),
                                'timestamp': datetime.datetime.now().isoformat(),
                                'microsecond': datetime.datetime.now().microsecond,
                                'second': datetime.datetime.now().second,
                                'minute': datetime.datetime.now().minute,
                                'hour': datetime.datetime.now().hour
                            }
                            print(f"New game started: {self.current_game['gameId']}")
                        
                        # Game ended
                        if self.current_game and state.get('status') == 'rugged':
                            self.current_game['serverSeed'] = state.get('serverSeed')
                            self.current_game['peakMultiplier'] = state.get('peakMultiplier')
                            self.current_game['finalTick'] = state.get('tick')
                            
                            # Store the completed game
                            self.games.append(self.current_game)
                            
                            print(f"Game ended: {self.current_game['gameId']}, Seed: {self.current_game['serverSeed'][:10]}...")
                            
                            # Reset current game
                            self.current_game = None
                            
                            game_count += 1
                            
                            # Save progress every 10 games
                            if game_count % 10 == 0:
                                self.save_data(f"seed_data_{game_count}.json")
                            
                            # Run quick analysis every 50 games
                            if game_count % 50 == 0:
                                await self.run_quick_analysis()
        
        except websockets.exceptions.ConnectionClosed:
            print("Connection closed")
        
        except Exception as e:
            print(f"Error in data collection: {e}")
        
        finally:
            self.save_data("final_seed_data.json")
    
    def load_data(self):
        """Load previously collected data"""
        if not self.data_path:
            print("No data path specified")
            return False
        
        try:
            # Check file extension
            if self.data_path.endswith('.jsonl'):
                # JSONL format (one JSON object per line)
                self.games = []
                with open(self.data_path, 'r') as f:
                    for line in f:
                        self.games.append(json.loads(line))
            else:
                # Regular JSON format
                with open(self.data_path, 'r') as f:
                    self.games = json.load(f)
            
            print(f"Loaded {len(self.games)} games from {self.data_path}")
            return True
        
        except Exception as e:
            print(f"Error loading data: {e}")
            return False
    
    def save_data(self, filename):
        """Save collected data to file"""
        try:
            with open(filename, 'w') as f:
                json.dump(self.games, f)
            print(f"Saved {len(self.games)} games to {filename}")
        except Exception as e:
            print(f"Error saving data: {e}")
    
    async def run_quick_analysis(self):
        """Run a quick analysis on collected data so far"""
        if len(self.games) < 10:
            print("Not enough games for analysis")
            return
        
        # Check for time patterns in the last 50 games
        recent_games = self.games[-50:]
        
        # Extract timestamps and seeds
        timestamps = []
        seeds = []
        
        for game in sample:
            if 'timestamp' in game and 'serverSeed' in game:
                timestamps.append(game['timestamp'])
                seeds.append(game['serverSeed'])
        
        # Try different combinations
        found_patterns = []
        
        for i, (ts, seed) in enumerate(zip(timestamps, seeds)):
            dt = datetime.datetime.fromisoformat(ts)
            
            # Different time formats to try
            time_formats = {
                'epoch': str(int(dt.timestamp())),
                'epoch_ms': str(int(dt.timestamp() * 1000)),
                'date': dt.strftime('%Y%m%d'),
                'time': dt.strftime('%H%M%S'),
                'datetime': dt.strftime('%Y%m%d%H%M%S'),
                'year': dt.strftime('%Y'),
                'month': dt.strftime('%m'),
                'day': dt.strftime('%d'),
                'hour': dt.strftime('%H'),
                'minute': dt.strftime('%M'),
                'second': dt.strftime('%S'),
                'microsecond': str(dt.microsecond),
                'game_id': game['gameId'] if 'gameId' in game else '',
            }
            
            # Try combinations
            for time_key, time_val in time_formats.items():
                # Skip empty values
                if not time_val:
                    continue
                
                # Try with different secrets
                for secret in common_secrets:
                    for salt_format in salt_formats:
                        salt = salt_format.format(secret)
                        
                        # Test different combinations
                        test_inputs = [
                            time_val + salt,  # TimeSecret
                            salt + time_val,  # SecretTime
                            time_val,         # Time only
                            salt,             # Secret only
                        ]
                        
                        for test_input in test_inputs:
                            # Try different hash algorithms
                            hash_md5 = hashlib.md5(test_input.encode()).hexdigest()
                            hash_sha1 = hashlib.sha1(test_input.encode()).hexdigest()
                            hash_sha256 = hashlib.sha256(test_input.encode()).hexdigest()
                            
                            # Check for exact matches
                            if seed == hash_md5:
                                found_patterns.append({
                                    'index': i,
                                    'seed': seed,
                                    'time_format': time_key,
                                    'secret': secret,
                                    'salt_format': salt_format,
                                    'input': test_input,
                                    'hash_type': 'md5',
                                    'match_type': 'exact'
                                })
                                print(f"MATCH! Seed {seed[:10]}... = MD5({test_input})")
                            
                            elif seed == hash_sha1:
                                found_patterns.append({
                                    'index': i,
                                    'seed': seed,
                                    'time_format': time_key,
                                    'secret': secret,
                                    'salt_format': salt_format,
                                    'input': test_input,
                                    'hash_type': 'sha1',
                                    'match_type': 'exact'
                                })
                                print(f"MATCH! Seed {seed[:10]}... = SHA1({test_input})")
                            
                            elif seed == hash_sha256:
                                found_patterns.append({
                                    'index': i,
                                    'seed': seed,
                                    'time_format': time_key,
                                    'secret': secret,
                                    'salt_format': salt_format,
                                    'input': test_input,
                                    'hash_type': 'sha256',
                                    'match_type': 'exact'
                                })
                                print(f"MATCH! Seed {seed[:10]}... = SHA256({test_input})")
                            
                            # Check for partial matches (first 16 chars)
                            elif seed.startswith(hash_md5[:16]):
                                found_patterns.append({
                                    'index': i,
                                    'seed': seed,
                                    'time_format': time_key,
                                    'secret': secret,
                                    'salt_format': salt_format,
                                    'input': test_input,
                                    'hash_type': 'md5',
                                    'match_type': 'partial_16'
                                })
                                print(f"PARTIAL MATCH! Seed {seed[:16]} starts with MD5({test_input})[:16]")
                            
                            elif seed.startswith(hash_sha1[:16]):
                                found_patterns.append({
                                    'index': i,
                                    'seed': seed,
                                    'time_format': time_key,
                                    'secret': secret,
                                    'salt_format': salt_format,
                                    'input': test_input,
                                    'hash_type': 'sha1',
                                    'match_type': 'partial_16'
                                })
                                print(f"PARTIAL MATCH! Seed {seed[:16]} starts with SHA1({test_input})[:16]")
                            
                            elif seed.startswith(hash_sha256[:16]):
                                found_patterns.append({
                                    'index': i,
                                    'seed': seed,
                                    'time_format': time_key,
                                    'secret': secret,
                                    'salt_format': salt_format,
                                    'input': test_input,
                                    'hash_type': 'sha256',
                                    'match_type': 'partial_16'
                                })
                                print(f"PARTIAL MATCH! Seed {seed[:16]} starts with SHA256({test_input})[:16]")
        
        # Validate patterns on remaining games
        if found_patterns and len(self.games) > sample_size:
            print("\nValidating patterns on remaining games...")
            
            # Group by pattern type
            pattern_groups = {}
            for pattern in found_patterns:
                key = (pattern['time_format'], pattern['secret'], pattern['salt_format'], 
                       pattern['hash_type'], pattern['match_type'])
                
                if key not in pattern_groups:
                    pattern_groups[key] = []
                
                pattern_groups[key].append(pattern)
            
            # Test each pattern group
            validation_results = {}
            
            for key, patterns in pattern_groups.items():
                time_format, secret, salt_format, hash_type, match_type = key
                
                salt = salt_format.format(secret)
                
                matches = 0
                total = 0
                
                # Test on next 100 games after the sample
                validation_games = self.games[sample_size:sample_size+100]
                
                for game in validation_games:
                    if 'timestamp' in game and 'serverSeed' in game:
                        total += 1
                        
                        ts = game['timestamp']
                        seed = game['serverSeed']
                        dt = datetime.datetime.fromisoformat(ts)
                        
                        # Get time value based on format
                        time_val = None
                        if time_format == 'epoch':
                            time_val = str(int(dt.timestamp()))
                        elif time_format == 'epoch_ms':
                            time_val = str(int(dt.timestamp() * 1000))
                        elif time_format == 'date':
                            time_val = dt.strftime('%Y%m%d')
                        elif time_format == 'time':
                            time_val = dt.strftime('%H%M%S')
                        elif time_format == 'datetime':
                            time_val = dt.strftime('%Y%m%d%H%M%S')
                        elif time_format == 'year':
                            time_val = dt.strftime('%Y')
                        elif time_format == 'month':
                            time_val = dt.strftime('%m')
                        elif time_format == 'day':
                            time_val = dt.strftime('%d')
                        elif time_format == 'hour':
                            time_val = dt.strftime('%H')
                        elif time_format == 'minute':
                            time_val = dt.strftime('%M')
                        elif time_format == 'second':
                            time_val = dt.strftime('%S')
                        elif time_format == 'microsecond':
                            time_val = str(dt.microsecond)
                        elif time_format == 'game_id':
                            time_val = game['gameId'] if 'gameId' in game else ''
                        
                        if not time_val:
                            continue
                        
                        # Same pattern as found before
                        test_input = None
                        for pattern in patterns:
                            if 'TimeSecret' in pattern['input']:
                                test_input = time_val + salt
                            elif 'SecretTime' in pattern['input']:
                                test_input = salt + time_val
                            elif pattern['input'] == pattern['time_format']:
                                test_input = time_val
                            else:
                                test_input = salt
                            
                            # Generate hash
                            hash_value = None
                            if hash_type == 'md5':
                                hash_value = hashlib.md5(test_input.encode()).hexdigest()
                            elif hash_type == 'sha1':
                                hash_value = hashlib.sha1(test_input.encode()).hexdigest()
                            elif hash_type == 'sha256':
                                hash_value = hashlib.sha256(test_input.encode()).hexdigest()
                            
                            # Check for match
                            if match_type == 'exact' and seed == hash_value:
                                matches += 1
                                break
                            elif match_type == 'partial_16' and seed.startswith(hash_value[:16]):
                                matches += 1
                                break
                
                validation_results[key] = {
                    'matches': matches,
                    'total': total,
                    'success_rate': matches / total if total > 0 else 0
                }
            
            # Display validation results
            print("\nValidation results:")
            for key, results in validation_results.items():
                time_format, secret, salt_format, hash_type, match_type = key
                print(f"Pattern: {time_format} + {salt_format.format(secret)} with {hash_type} ({match_type})")
                print(f"  Success rate: {results['matches']}/{results['total']} = {results['success_rate']*100:.2f}%")
        
        return found_patterns
    
    def test_game_id_pattern(self):
        """
        Test if game IDs follow a predictable pattern
        """
        if not self.games:
            if not self.load_data():
                print("No data available for analysis")
                return
        
        print(f"Analyzing game ID patterns in {len(self.games)} games...")
        
        # Extract game IDs
        game_ids = [game['gameId'] for game in self.games if 'gameId' in game]
        
        # Extract components
        components = []
        
        for game_id in game_ids:
            if '-' in game_id:
                parts = game_id.split('-')
                if len(parts) == 2:
                    date_part = parts[0]
                    id_part = parts[1]
                    
                    components.append({
                        'game_id': game_id,
                        'date_part': date_part,
                        'id_part': id_part
                    })
        
        # Analyze date part pattern
        date_patterns = {}
        for comp in components:
            date_part = comp['date_part']
            
            # Check if it's a valid date format (YYYYMMDD)
            if len(date_part) == 8:
                try:
                    year = int(date_part[:4])
                    month = int(date_part[4:6])
                    day = int(date_part[6:8])
                    
                    if 2000 <= year <= 2100 and 1 <= month <= 12 and 1 <= day <= 31:
                        date_patterns[date_part] = date_patterns.get(date_part, 0) + 1
                except:
                    pass
        
        # Analyze ID part pattern
        id_patterns = {}
        for comp in components:
            id_part = comp['id_part']
            
            # Check if it's hexadecimal
            try:
                int(id_part, 16)
                id_patterns['hex'] = id_patterns.get('hex', 0) + 1
            except:
                pass
            
            # Check length
            length = len(id_part)
            id_patterns[f'length_{length}'] = id_patterns.get(f'length_{length}', 0) + 1
        
        # Check for sequential patterns
        sequential = 0
        for i in range(1, len(components)):
            prev_id = components[i-1]['id_part']
            curr_id = components[i]['id_part']
            
            try:
                prev_int = int(prev_id, 16)
                curr_int = int(curr_id, 16)
                
                # Check if sequential or close
                if curr_int - prev_int == 1:
                    sequential += 1
            except:
                pass
        
        # Check if ID part changes with time
        time_correlation = []
        
        for i in range(len(self.games)):
            if 'gameId' in self.games[i] and 'timestamp' in self.games[i]:
                game_id = self.games[i]['gameId']
                timestamp = self.games[i]['timestamp']
                
                if '-' in game_id:
                    id_part = game_id.split('-')[1]
                    
                    try:
                        id_int = int(id_part, 16)
                        time_correlation.append((timestamp, id_int))
                    except:
                        pass
        
        # Sort by timestamp
        time_correlation.sort(key=lambda x: x[0])
        
        # Calculate correlation
        if time_correlation:
            times = [datetime.datetime.fromisoformat(tc[0]).timestamp() for tc in time_correlation]
            ids = [tc[1] for tc in time_correlation]
            
            correlation, p_value = pearsonr(times, ids)
        else:
            correlation, p_value = 0, 1.0
        
        # Compile results
        game_id_analysis = {
            'date_patterns': date_patterns,
            'id_patterns': id_patterns,
            'sequential_count': sequential,
            'time_correlation': correlation,
            'time_correlation_p_value': p_value
        }
        
        # Display results
        print("\n=== Game ID Analysis Results ===")
        
        print("Date part patterns:")
        for pattern, count in sorted(date_patterns.items(), key=lambda x: x[1], reverse=True)[:5]:
            print(f"  - {pattern}: {count} occurrences")
        
        print("\nID part patterns:")
        for pattern, count in sorted(id_patterns.items(), key=lambda x: x[1], reverse=True):
            print(f"  - {pattern}: {count} occurrences")
        
        print(f"\nSequential IDs: {sequential} out of {len(components)-1}")
        
        print(f"Time-ID correlation: {correlation:.4f} (p-value: {p_value:.6f})")
        
        if p_value < 0.05:
            print("  * Significant correlation between time and game ID!")
        
        return game_id_analysis
    
    async def run_full_analysis(self):
        """
        Run all analysis methods and compile results
        """
        results = {}
        
        # Analyze time patterns
        print("\n--- Running Time Pattern Analysis ---")
        results['time_patterns'] = self.analyze_time_patterns()
        
        # Analyze binary patterns
        print("\n--- Running Binary Pattern Analysis ---")
        results['binary_patterns'] = self.analyze_binary_patterns()
        
        # Brute force seed generation
        print("\n--- Attempting to Brute Force Seed Generation ---")
        results['brute_force'] = self.brute_force_seed_generation(sample_size=20)
        
        # Test game ID patterns
        print("\n--- Analyzing Game ID Patterns ---")
        results['game_id_patterns'] = self.test_game_id_pattern()
        
        # Save results
        with open('seed_analysis_results.json', 'w') as f:
            # Convert non-serializable objects
            import numpy as np
            def convert_to_serializable(obj):
                if isinstance(obj, np.integer):
                    return int(obj)
                elif isinstance(obj, np.floating):
                    return float(obj)
                elif isinstance(obj, np.ndarray):
                    return obj.tolist()
                elif isinstance(obj, datetime.datetime):
                    return obj.isoformat()
                return obj
            
            json.dump(results, f, default=convert_to_serializable, indent=2)
        
        print("\nAnalysis complete! Results saved to seed_analysis_results.json")
        
        return results

# Main function to run the analyzer
async def main():
    # You can either specify a WebSocket URL for live data collection
    # or a path to previously collected data
    
    # For live data collection:
    # analyzer = RugsTimeSeedAnalyzer(websocket_url="wss://rugs.fun/socket")
    # await analyzer.collect_data(max_games=1000)
    
    # For analysis of existing data:
    analyzer = RugsTimeSeedAnalyzer(data_path="rugs_data.jsonl")
    await analyzer.run_full_analysis()

# Run the analyzer
if __name__ == "__main__":
    asyncio.run(main())
        timestamps = [game['timestamp'] for game in recent_games]
        seeds = [game['serverSeed'] for game in recent_games]
        
        # Convert timestamps to seconds since epoch
        epoch_times = [datetime.datetime.fromisoformat(ts).timestamp() for ts in timestamps]
        
        # Check for simple patterns
        time_diffs = [epoch_times[i] - epoch_times[i-1] for i in range(1, len(epoch_times))]
        avg_time_diff = sum(time_diffs) / len(time_diffs)
        
        print(f"Average time between games: {avg_time_diff:.2f} seconds")
        
        # Check if seeds are directly related to timestamps
        for i in range(min(10, len(recent_games))):
            ts = timestamps[i]
            seed = seeds[i]
            dt = datetime.datetime.fromisoformat(ts)
            
            # Try various time formats
            time_formats = {
                'epoch': str(int(dt.timestamp())),
                'epoch_ms': str(int(dt.timestamp() * 1000)),
                'date': dt.strftime('%Y%m%d'),
                'time': dt.strftime('%H%M%S'),
                'datetime': dt.strftime('%Y%m%d%H%M%S')
            }
            
            for name, time_str in time_formats.items():
                # Try different hash algorithms
                hash_md5 = hashlib.md5(time_str.encode()).hexdigest()
                hash_sha1 = hashlib.sha1(time_str.encode()).hexdigest()
                hash_sha256 = hashlib.sha256(time_str.encode()).hexdigest()
                
                # Check for matches
                if seed == hash_md5 or seed == hash_sha1 or seed == hash_sha256:
                    print(f"MATCH FOUND: Seed {seed[:10]}... matches {name} with hash algorithm")
                    self.hash_candidates.append({
                        'timestamp': ts,
                        'seed': seed,
                        'time_format': name,
                        'hash_type': 'md5' if seed == hash_md5 else ('sha1' if seed == hash_sha1 else 'sha256')
                    })
                
                # Check for partial matches (first 16 chars)
                elif seed.startswith(hash_md5[:16]) or seed.startswith(hash_sha1[:16]) or seed.startswith(hash_sha256[:16]):
                    hash_type = 'md5' if seed.startswith(hash_md5[:16]) else ('sha1' if seed.startswith(hash_sha1[:16]) else 'sha256')
                    print(f"PARTIAL MATCH: Seed {seed[:16]} starts with {name} hash ({hash_type})")
                    self.hash_candidates.append({
                        'timestamp': ts,
                        'seed': seed,
                        'time_format': name,
                        'hash_type': hash_type,
                        'match_type': 'partial'
                    })
    
    def analyze_time_patterns(self):
        """
        Analyze various time-based patterns in seed generation
        """
        if not self.games:
            if not self.load_data():
                print("No data available for analysis")
                return
        
        print(f"Analyzing time patterns in {len(self.games)} games...")
        
        # Extract timestamps and seeds
        timestamps = []
        seeds = []
        game_ids = []
        
        for game in self.games:
            if 'timestamp' in game and 'serverSeed' in game:
                timestamps.append(game['timestamp'])
                seeds.append(game['serverSeed'])
                game_ids.append(game['gameId'])
        
        # Convert timestamps to datetime objects
        dt_objects = [datetime.datetime.fromisoformat(ts) for ts in timestamps]
        
        # Extract time components
        seconds = [dt.second for dt in dt_objects]
        minutes = [dt.minute for dt in dt_objects]
        hours = [dt.hour for dt in dt_objects]
        microseconds = [dt.microsecond for dt in dt_objects]
        
        # Convert timestamps to seconds since epoch
        epoch_times = [dt.timestamp() for dt in dt_objects]
        
        # Calculate various time deltas
        time_diffs = [epoch_times[i] - epoch_times[i-1] for i in range(1, len(epoch_times))]
        
        # Extract game IDs and check for patterns
        game_id_patterns = []
        for i in range(len(game_ids)):
            game_id = game_ids[i]
            if '-' in game_id:
                parts = game_id.split('-')
                if len(parts) == 2:
                    date_part = parts[0]
                    id_part = parts[1]
                    
                    # Check if date part matches timestamp
                    if len(date_part) == 8:  # YYYYMMDD format
                        game_date = date_part
                        timestamp_date = dt_objects[i].strftime('%Y%m%d')
                        
                        if game_date == timestamp_date:
                            game_id_patterns.append({
                                'game_id': game_id,
                                'date_match': True,
                                'date_part': date_part,
                                'timestamp': timestamps[i]
                            })
        
        # Check if seeds are hashes of timestamps
        seed_time_patterns = []
        
        for i in range(len(seeds)):
            seed = seeds[i]
            dt = dt_objects[i]
            
            # Try various time formats
            time_formats = {
                'epoch': str(int(dt.timestamp())),
                'epoch_ms': str(int(dt.timestamp() * 1000)),
                'date': dt.strftime('%Y%m%d'),
                'time': dt.strftime('%H%M%S'),
                'datetime': dt.strftime('%Y%m%d%H%M%S'),
                'game_id': game_ids[i]
            }
            
            for name, time_str in time_formats.items():
                # Try different hash algorithms
                hash_md5 = hashlib.md5(time_str.encode()).hexdigest()
                hash_sha1 = hashlib.sha1(time_str.encode()).hexdigest()
                hash_sha256 = hashlib.sha256(time_str.encode()).hexdigest()
                
                # Check for matches or partial matches
                if seed == hash_md5 or seed == hash_sha1 or seed == hash_sha256:
                    hash_type = 'md5' if seed == hash_md5 else ('sha1' if seed == hash_sha1 else 'sha256')
                    seed_time_patterns.append({
                        'seed': seed,
                        'timestamp': timestamps[i],
                        'time_format': name,
                        'hash_type': hash_type,
                        'match_type': 'full'
                    })
                elif seed.startswith(hash_md5[:16]) or seed.startswith(hash_sha1[:16]) or seed.startswith(hash_sha256[:16]):
                    hash_type = 'md5' if seed.startswith(hash_md5[:16]) else ('sha1' if seed.startswith(hash_sha1[:16]) else 'sha256')
                    seed_time_patterns.append({
                        'seed': seed,
                        'timestamp': timestamps[i],
                        'time_format': name,
                        'hash_type': hash_type,
                        'match_type': 'partial'
                    })
        
        # Check for patterns in specific bits of the seeds
        binary_seeds = []
        for seed in seeds:
            binary = bin(int(seed, 16))[2:].zfill(len(seed) * 4)
            binary_seeds.append(binary)
        
        # Analyze each bit position
        bit_patterns = {}
        for bit_pos in range(min(256, len(binary_seeds[0]))):
            bit_values = [int(binary[bit_pos]) for binary in binary_seeds]
            
            # Count occurrences of 0 and 1
            zeros = bit_values.count(0)
            ones = bit_values.count(1)
            
            # Chi-square test for uniformity
            observed = [zeros, ones]
            expected = [len(bit_values) / 2, len(bit_values) / 2]
            chi2_stat, p_value = chisquare(observed, expected)
            
            # Store results if significant
            if p_value < 0.05:
                bit_patterns[bit_pos] = {
                    'zeros': zeros,
                    'ones': ones,
                    'chi2': chi2_stat,
                    'p_value': p_value
                }
        
        # Analyze sequences of bits
        sequence_patterns = {}
        for seq_len in [2, 3, 4]:
            for i in range(min(256 - seq_len, len(binary_seeds[0]) - seq_len)):
                sequences = {}
                
                for binary in binary_seeds:
                    seq = binary[i:i+seq_len]
                    sequences[seq] = sequences.get(seq, 0) + 1
                
                # Check if distribution is uniform
                observed = list(sequences.values())
                expected = [len(binary_seeds) / (2 ** seq_len)] * len(observed)
                
                try:
                    chi2_stat, p_value = chisquare(observed, expected)
                    
                    # Store results if significant
                    if p_value < 0.05:
                        sequence_patterns[f"{i}:{i+seq_len}"] = {
                            'sequences': sequences,
                            'chi2': chi2_stat,
                            'p_value': p_value
                        }
                except:
                    # Skip if chi-square test fails (e.g., not enough data)
                    pass
        
        # Store results
        self.time_patterns['game_id_patterns'] = game_id_patterns
        self.time_patterns['seed_time_patterns'] = seed_time_patterns
        self.time_patterns['bit_patterns'] = bit_patterns
        self.time_patterns['sequence_patterns'] = sequence_patterns
        self.time_patterns['time_diffs'] = time_diffs
        
        # Display results
        print("\n=== Time Pattern Analysis Results ===")
        print(f"Analyzed {len(seeds)} seeds")
        print(f"Game ID patterns found: {len(game_id_patterns)}")
        print(f"Seed-time patterns found: {len(seed_time_patterns)}")
        print(f"Bit position patterns found: {len(bit_patterns)}")
        print(f"Bit sequence patterns found: {len(sequence_patterns)}")
        
        if seed_time_patterns:
            print("\nPotential seed-time pattern matches:")
            for pattern in seed_time_patterns[:10]:  # Show first 10
                print(f"  - {pattern['match_type']} match: {pattern['time_format']} with {pattern['hash_type']}")
        
        # Visualize time differences
        plt.figure(figsize=(12, 6))
        plt.hist(time_diffs, bins=50, alpha=0.7)
        plt.title('Distribution of Time Between Games')
        plt.xlabel('Time (seconds)')
        plt.ylabel('Frequency')
        plt.savefig('time_differences.png')
        
        # Visualize bit patterns
        if bit_patterns:
            plt.figure(figsize=(12, 6))
            bit_positions = list(bit_patterns.keys())
            p_values = [bit_patterns[pos]['p_value'] for pos in bit_positions]
            plt.bar(bit_positions, -np.log10(p_values), alpha=0.7)
            plt.axhline(-np.log10(0.05), color='r', linestyle='--', label='p=0.05')
            plt.title('Significance of Bit Position Patterns (-log10 p-value)')
            plt.xlabel('Bit Position')
            plt.ylabel('-log10(p-value)')
            plt.legend()
            plt.savefig('bit_patterns.png')
        
        return self.time_patterns
    
    def analyze_binary_patterns(self):
        """
        Analyze binary patterns in seeds to detect potential PRNG weaknesses
        """
        if not self.games:
            if not self.load_data():
                print("No data available for analysis")
                return
        
        print(f"Analyzing binary patterns in {len(self.games)} seeds...")
        
        # Extract seeds
        seeds = [game['serverSeed'] for game in self.games if 'serverSeed' in game]
        
        # Convert to binary
        binary_seeds = []
        for seed in seeds:
            binary = bin(int(seed, 16))[2:].zfill(len(seed) * 4)
            binary_seeds.append(binary)
        
        # Analyze entropy of each seed
        entropies = []
        for binary in binary_seeds:
            # Count 1s and 0s
            ones = binary.count('1')
            zeros = binary.count('0')
            total = len(binary)
            
            # Calculate entropy
            p_one = ones / total
            p_zero = zeros / total
            
            import math
            entropy = 0
            if p_one > 0:
                entropy -= p_one * math.log2(p_one)
            if p_zero > 0:
                entropy -= p_zero * math.log2(p_zero)
            
            entropies.append(entropy)
        
        # Create visual representation of binary seeds
        plt.figure(figsize=(12, 8))
        
        # Create a binary heatmap (limited to first 100 seeds, 256 bits each)
        max_seeds = min(100, len(binary_seeds))
        max_bits = min(256, len(binary_seeds[0]))
        
        binary_matrix = np.zeros((max_seeds, max_bits))
        
        for i in range(max_seeds):
            for j in range(max_bits):
                binary_matrix[i, j] = int(binary_seeds[i][j])
        
        # Create custom colormap (white for 0, black for 1)
        cmap = LinearSegmentedColormap.from_list('binary', ['white', 'black'])
        
        plt.imshow(binary_matrix, cmap=cmap, aspect='auto')
        plt.title('Binary Representation of Server Seeds')
        plt.xlabel('Bit Position')
        plt.ylabel('Seed Index')
        plt.colorbar(ticks=[0, 1], label='Bit Value')
        plt.savefig('binary_heatmap.png')
        
        # Analyze autocorrelation in binary sequences
        autocorr_results = {}
        
        for lag in range(1, 21):  # Test lags 1-20
            # Calculate autocorrelation for each seed
            lag_corrs = []
            
            for binary in binary_seeds:
                binary_values = [int(bit) for bit in binary]
                n = len(binary_values)
                
                # Calculate autocorrelation at specified lag
                corr = 0
                for i in range(n - lag):
                    corr += binary_values[i] * binary_values[i + lag]
                
                corr = corr / (n - lag)
                lag_corrs.append(corr)
            
            # Store average autocorrelation
            autocorr_results[lag] = sum(lag_corrs) / len(lag_corrs)
        
        # Visualize autocorrelation
        plt.figure(figsize=(12, 6))
        lags = list(autocorr_results.keys())
        autocorrs = list(autocorr_results.values())
        plt.bar(lags, autocorrs, alpha=0.7)
        plt.title('Average Autocorrelation in Binary Seeds')
        plt.xlabel('Lag')
        plt.ylabel('Autocorrelation')
        plt.savefig('autocorrelation.png')
        
        # Test for runs in binary sequences
        run_results = {}
        
        for binary in binary_seeds:
            runs = 1
            for i in range(1, len(binary)):
                if binary[i] != binary[i-1]:
                    runs += 1
            
            run_results[runs] = run_results.get(runs, 0) + 1
        
        # Calculate expected runs distribution
        seed_length = len(binary_seeds[0])
        expected_runs = {}
        
        for r in range(2, seed_length + 1, 2):
            # Expected number of runs of length r in a random binary sequence
            expected = len(binary_seeds) * (seed_length - r + 3) / (2 ** r)
            expected_runs[r] = expected
        
        # Compare observed vs expected runs
        runs_comparison = {}
        for r in sorted(run_results.keys()):
            if r in expected_runs:
                observed = run_results[r]
                expected = expected_runs[r]
                
                # Binomial test
                p_value = binom_test(observed, n=len(binary_seeds), p=expected/len(binary_seeds))
                
                runs_comparison[r] = {
                    'observed': observed,
                    'expected': expected,
                    'p_value': p_value
                }
        
        # Store results
        self.bit_patterns = {
            'entropies': entropies,
            'autocorrelation': autocorr_results,
            'runs': runs_comparison
        }
        
        # Display results
        print("\n=== Binary Pattern Analysis Results ===")
        print(f"Average entropy: {sum(entropies) / len(entropies):.6f} (ideal for random binary: 1.0)")
        
        # Check for unusual entropy values
        low_entropy = [i for i, e in enumerate(entropies) if e < 0.95]
        if low_entropy:
            print(f"Seeds with suspiciously low entropy: {len(low_entropy)}")
            for i in low_entropy[:5]:  # Show first 5
                print(f"  - Seed {i}: entropy = {entropies[i]:.6f}")
        
        # Check for significant autocorrelations
        sig_autocorr = [lag for lag, corr in autocorr_results.items() if abs(corr - 0.5) > 0.05]
        if sig_autocorr:
            print(f"Significant autocorrelations at lags: {sig_autocorr}")
        
        # Check for unusual run patterns
        sig_runs = [r for r, data in runs_comparison.items() if data['p_value'] < 0.05]
        if sig_runs:
            print(f"Unusual run lengths: {sig_runs}")
            for r in sig_runs[:5]:  # Show first 5
                data = runs_comparison[r]
                print(f"  - Runs of length {r}: observed={data['observed']}, expected={data['expected']:.2f}, p={data['p_value']:.6f}")
        
        return self.bit_patterns
    
    def brute_force_seed_generation(self, sample_size=10):
        """
        Attempt to brute force the seed generation algorithm
        by trying common patterns with time components
        
        Parameters:
            sample_size (int): Number of seeds to test
        """
        if not self.games:
            if not self.load_data():
                print("No data available for analysis")
                return
        
        print(f"Attempting to brute force seed generation algorithm...")
        
        # Take a sample of seeds
        sample = self.games[:sample_size]
        
        # Common secrets that might be used
        common_secrets = [
            "rugs.fun", "rugsfun", "rug", "rugpull",
            "crypto", "game", "seed", "random",
            "bitcoin", "ethereum", "secret", "provably-fair"
        ]
        
        # Common hash salt formats
        salt_formats = [
            "{}", "{}_salt", "salt_{}", "{}_key", "key_{}", "{}_seed", "seed_{}"
        ]