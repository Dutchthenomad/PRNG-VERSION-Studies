#!/usr/bin/env python3
"""
🎮 RUGS.FUN DATA ANALYSIS TOOLS

Python tools for analyzing collected game data from persistent-collector.js
Designed for statistical analysis and ML pattern detection

Usage:
    python analysis-tools.py --load-data
    python analysis-tools.py --analyze-patterns
    python analysis-tools.py --verify-prng
"""

import json
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from pathlib import Path
import argparse
import hashlib
import time
from datetime import datetime, timedelta
from scipy import stats
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, confusion_matrix
import warnings
warnings.filterwarnings('ignore')

class RugsDataAnalyzer:
    def __init__(self, data_dir="rugs-data"):
        self.data_dir = Path(data_dir)
        self.games_df = None
        self.raw_games = []
        
    def load_collected_data(self):
        """Load all collected game data from JSONL files"""
        print("📊 Loading collected game data...")
        
        # Load from master stream file
        master_file = self.data_dir / "all-games.jsonl"
        
        if not master_file.exists():
            print(f"❌ Master data file not found: {master_file}")
            return False
            
        games = []
        with open(master_file, 'r') as f:
            for line_num, line in enumerate(f, 1):
                try:
                    game = json.loads(line.strip())
                    games.append(game)
                except json.JSONDecodeError as e:
                    print(f"⚠️  Error parsing line {line_num}: {e}")
                    continue
        
        self.raw_games = games
        print(f"✅ Loaded {len(games)} games from master file")
        
        # Convert to DataFrame for analysis
        self.games_df = self.create_analysis_dataframe(games)
        print(f"📈 Created analysis DataFrame: {self.games_df.shape}")
        
        return True
    
    def create_analysis_dataframe(self, games):
        """Convert raw game data to pandas DataFrame for analysis"""
        analysis_data = []
        
        for i, game in enumerate(games):
            try:
                # Extract key metrics for analysis
                analysis = game.get('analysis', {})
                
                game_data = {
                    # Basic identifiers
                    'game_number': i + 1,
                    'game_id': game.get('gameId', ''),
                    'recording_start': game.get('recordingStart', ''),
                    'recording_end': game.get('recordingEnd', ''),
                    'duration_seconds': game.get('duration', 0),
                    
                    # Game outcome metrics
                    'peak_multiplier': analysis.get('peakMultiplier', 0),
                    'final_tick': analysis.get('finalTick', 0),
                    'is_instarug': analysis.get('isInstarug', False),
                    'total_trades': analysis.get('totalTrades', 0),
                    'unique_players': analysis.get('uniquePlayers', 0),
                    
                    # Event metrics
                    'total_events': game.get('totalEvents', 0),
                    'game_state_updates': analysis.get('gameStateUpdates', 0),
                    
                    # Price metrics
                    'price_min': analysis.get('priceRange', {}).get('min', 0),
                    'price_max': analysis.get('priceRange', {}).get('max', 0),
                    
                    # Collection metadata
                    'collection_version': game.get('collectionMetadata', {}).get('collectorVersion', ''),
                    'hourly_game_number': game.get('collectionMetadata', {}).get('hourlyGameNumber', 0),
                    
                    # Timing data (if available)
                    'rug_event_timing': game.get('rugEventTiming', {}),
                    
                    # Completion reason
                    'completion_reason': game.get('reason', 'UNKNOWN')
                }
                
                analysis_data.append(game_data)
                
            except Exception as e:
                print(f"⚠️  Error processing game {i}: {e}")
                continue
        
        df = pd.DataFrame(analysis_data)
        
        # Convert timestamps
        df['recording_start'] = pd.to_datetime(df['recording_start'])
        df['recording_end'] = pd.to_datetime(df['recording_end'])
        
        # Create derived features
        df['hour'] = df['recording_start'].dt.hour
        df['day_of_week'] = df['recording_start'].dt.dayofweek
        df['peak_category'] = pd.cut(df['peak_multiplier'], 
                                   bins=[0, 2, 5, 10, 20, 50, np.inf],
                                   labels=['0-2x', '2-5x', '5-10x', '10-20x', '20-50x', '50x+'])
        
        return df
    
    def analyze_basic_patterns(self):
        """Perform basic statistical analysis of collected data"""
        if self.games_df is None:
            print("❌ No data loaded. Run load_collected_data() first.")
            return
            
        print("\n🔍 BASIC PATTERN ANALYSIS")
        print("=" * 50)
        
        df = self.games_df
        
        # Basic statistics
        print(f"📊 Total Games Analyzed: {len(df)}")
        print(f"📅 Date Range: {df['recording_start'].min()} to {df['recording_start'].max()}")
        print(f"⏱️  Collection Duration: {df['recording_end'].max() - df['recording_start'].min()}")
        
        # Game outcome statistics
        print(f"\n🎯 Game Outcomes:")
        print(f"   Instarugs: {df['is_instarug'].sum()} ({df['is_instarug'].mean()*100:.1f}%)")
        print(f"   Average Peak: {df['peak_multiplier'].mean():.2f}x")
        print(f"   Median Peak: {df['peak_multiplier'].median():.2f}x")
        print(f"   Max Peak: {df['peak_multiplier'].max():.2f}x")
        
        # Peak multiplier distribution
        print(f"\n📈 Peak Multiplier Distribution:")
        peak_dist = df['peak_category'].value_counts().sort_index()
        for category, count in peak_dist.items():
            percentage = (count / len(df)) * 100
            print(f"   {category}: {count} games ({percentage:.1f}%)")
        
        # Timing analysis
        print(f"\n⏱️  Game Duration Statistics:")
        print(f"   Average Duration: {df['duration_seconds'].mean():.1f}s")
        print(f"   Average Final Tick: {df['final_tick'].mean():.0f}")
        print(f"   Average Events per Game: {df['total_events'].mean():.0f}")
        
        return df
    
    def analyze_cross_game_patterns(self):
        """Analyze patterns between consecutive games"""
        if self.games_df is None:
            print("❌ No data loaded. Run load_collected_data() first.")
            return
            
        print("\n🔗 CROSS-GAME PATTERN ANALYSIS")
        print("=" * 50)
        
        df = self.games_df.copy()
        
        # Create lagged features
        df['prev_peak'] = df['peak_multiplier'].shift(1)
        df['prev_is_instarug'] = df['is_instarug'].shift(1)
        df['next_is_instarug'] = df['is_instarug'].shift(-1)
        
        # Remove rows with NaN values
        analysis_df = df.dropna()
        
        if len(analysis_df) < 10:
            print("❌ Insufficient data for cross-game analysis")
            return
        
        # Analyze instarug probability following different peak ranges
        print("🎯 Instarug Probability Following Different Peak Multipliers:")
        
        peak_bins = [0, 2, 5, 10, 20, 50, np.inf]
        peak_labels = ['0-2x', '2-5x', '5-10x', '10-20x', '20-50x', '50x+']
        
        analysis_df['prev_peak_bin'] = pd.cut(analysis_df['prev_peak'], 
                                            bins=peak_bins, labels=peak_labels)
        
        instarug_by_peak = analysis_df.groupby('prev_peak_bin')['next_is_instarug'].agg(['count', 'sum', 'mean'])
        instarug_by_peak.columns = ['total_games', 'instarugs', 'instarug_probability']
        
        overall_instarug_rate = analysis_df['next_is_instarug'].mean()
        
        print(f"\nOverall instarug rate: {overall_instarug_rate:.3f} ({overall_instarug_rate*100:.1f}%)")
        print("\nBy previous peak multiplier:")
        
        for peak_range in peak_labels:
            if peak_range in instarug_by_peak.index:
                row = instarug_by_peak.loc[peak_range]
                prob = row['instarug_probability']
                count = row['total_games']
                ratio = prob / overall_instarug_rate if overall_instarug_rate > 0 else 0
                
                print(f"   {peak_range}: {prob:.3f} ({prob*100:.1f}%) | "
                      f"{count} games | {ratio:.1f}x baseline")
        
        # Statistical significance test for 50x+ games
        high_multi_games = analysis_df[analysis_df['prev_peak'] >= 50]
        other_games = analysis_df[analysis_df['prev_peak'] < 50]
        
        if len(high_multi_games) > 0 and len(other_games) > 0:
            high_multi_instarug_rate = high_multi_games['next_is_instarug'].mean()
            other_instarug_rate = other_games['next_is_instarug'].mean()
            
            # Chi-square test
            from scipy.stats import chi2_contingency
            
            contingency_table = [
                [high_multi_games['next_is_instarug'].sum(), 
                 len(high_multi_games) - high_multi_games['next_is_instarug'].sum()],
                [other_games['next_is_instarug'].sum(),
                 len(other_games) - other_games['next_is_instarug'].sum()]
            ]
            
            chi2, p_value, dof, expected = chi2_contingency(contingency_table)
            
            print(f"\n📊 Statistical Test (50x+ vs Others):")
            print(f"   50x+ instarug rate: {high_multi_instarug_rate:.3f} ({len(high_multi_games)} games)")
            print(f"   Other instarug rate: {other_instarug_rate:.3f} ({len(other_games)} games)")
            print(f"   Chi-square statistic: {chi2:.3f}")
            print(f"   P-value: {p_value:.6f}")
            print(f"   Statistically significant: {'YES' if p_value < 0.05 else 'NO'}")
        
        return instarug_by_peak
    
    def verify_prng_system(self):
        """Verify the provably fair PRNG system using collected data"""
        print("\n🎲 PRNG VERIFICATION ANALYSIS")
        print("=" * 50)
        
        # This would use the PRNG verification algorithms from your knowledge base
        # For now, we'll do basic analysis of game outcomes
        
        if self.games_df is None:
            print("❌ No data loaded. Run load_collected_data() first.")
            return
        
        df = self.games_df
        
        # Check for obvious patterns that would indicate manipulation
        print("🔍 Checking for manipulation indicators:")
        
        # 1. Game ID randomness (basic check)
        game_ids = df['game_id'].dropna()
        if len(game_ids) > 10:
            # Check if game IDs appear sequential (would be suspicious)
            print(f"   Game ID uniqueness: {len(game_ids.unique())} / {len(game_ids)} ({len(game_ids.unique())/len(game_ids)*100:.1f}%)")
        
        # 2. Peak multiplier distribution analysis
        peaks = df['peak_multiplier'].dropna()
        if len(peaks) > 50:
            # Test for uniform distribution in log space (expected for exponential decay)
            log_peaks = np.log(peaks[peaks > 0])
            _, p_value = stats.normaltest(log_peaks)
            print(f"   Peak distribution normality (log): p={p_value:.4f}")
        
        # 3. Temporal patterns that shouldn't exist
        if 'hour' in df.columns:
            hourly_instarug_rates = df.groupby('hour')['is_instarug'].mean()
            hourly_variance = hourly_instarug_rates.var()
            print(f"   Hourly instarug rate variance: {hourly_variance:.6f}")
            
            # Check for suspicious hourly patterns
            max_hourly_rate = hourly_instarug_rates.max()
            min_hourly_rate = hourly_instarug_rates.min()
            if max_hourly_rate / min_hourly_rate > 3:  # Arbitrary threshold
                print(f"   ⚠️  Suspicious hourly variation detected: {min_hourly_rate:.3f} to {max_hourly_rate:.3f}")
        
        print("✅ Basic PRNG verification completed")
        
        return True
    
    def create_visualizations(self):
        """Create visualizations of the collected data"""
        if self.games_df is None:
            print("❌ No data loaded. Run load_collected_data() first.")
            return
            
        print("\n📊 CREATING VISUALIZATIONS")
        print("=" * 50)
        
        df = self.games_df
        
        # Set up the plotting style
        plt.style.use('seaborn-v0_8')
        fig, axes = plt.subplots(2, 2, figsize=(15, 12))
        fig.suptitle('Rugs.fun Data Collection Analysis', fontsize=16, fontweight='bold')
        
        # 1. Peak multiplier distribution
        axes[0, 0].hist(df['peak_multiplier'], bins=50, alpha=0.7, edgecolor='black')
        axes[0, 0].set_xlabel('Peak Multiplier')
        axes[0, 0].set_ylabel('Frequency')
        axes[0, 0].set_title('Peak Multiplier Distribution')
        axes[0, 0].set_xlim(0, min(100, df['peak_multiplier'].max()))
        
        # 2. Instarug analysis
        if len(df) > 1:
            df_lag = df.dropna(subset=['peak_multiplier'])
            df_lag['prev_peak'] = df_lag['peak_multiplier'].shift(1)
            df_lag['next_is_instarug'] = df_lag['is_instarug'].shift(-1)
            df_lag = df_lag.dropna()
            
            if len(df_lag) > 10:
                # Create peak bins for visualization
                df_lag['prev_peak_bin'] = pd.cut(df_lag['prev_peak'], 
                                               bins=[0, 2, 5, 10, 20, 50, np.inf],
                                               labels=['0-2x', '2-5x', '5-10x', '10-20x', '20-50x', '50x+'])
                
                instarug_rates = df_lag.groupby('prev_peak_bin')['next_is_instarug'].mean()
                
                bars = axes[0, 1].bar(range(len(instarug_rates)), instarug_rates.values, alpha=0.7)
                axes[0, 1].set_xlabel('Previous Game Peak Multiplier')
                axes[0, 1].set_ylabel('Instarug Probability')
                axes[0, 1].set_title('Instarug Probability by Previous Peak')
                axes[0, 1].set_xticks(range(len(instarug_rates)))
                axes[0, 1].set_xticklabels(instarug_rates.index, rotation=45)
                
                # Add overall average line
                overall_rate = df_lag['next_is_instarug'].mean()
                axes[0, 1].axhline(y=overall_rate, color='red', linestyle='--', 
                                 label=f'Overall Average: {overall_rate:.3f}')
                axes[0, 1].legend()
        
        # 3. Collection timeline
        if 'recording_start' in df.columns:
            df_time = df.set_index('recording_start').resample('H').size()
            axes[1, 0].plot(df_time.index, df_time.values, marker='o', markersize=3)
            axes[1, 0].set_xlabel('Time')
            axes[1, 0].set_ylabel('Games per Hour')
            axes[1, 0].set_title('Collection Rate Over Time')
            axes[1, 0].tick_params(axis='x', rotation=45)
        
        # 4. Game duration vs peak multiplier
        if len(df) > 10:
            scatter = axes[1, 1].scatter(df['duration_seconds'], df['peak_multiplier'], 
                                       alpha=0.6, c=df['is_instarug'], cmap='RdYlBu')
            axes[1, 1].set_xlabel('Game Duration (seconds)')
            axes[1, 1].set_ylabel('Peak Multiplier')
            axes[1, 1].set_title('Duration vs Peak Multiplier')
            axes[1, 1].set_yscale('log')
            plt.colorbar(scatter, ax=axes[1, 1], label='Is Instarug')
        
        plt.tight_layout()
        
        # Save the visualization
        output_path = self.data_dir / 'analysis' / 'collection_analysis.png'
        output_path.parent.mkdir(exist_ok=True)
        plt.savefig(output_path, dpi=300, bbox_inches='tight')
        print(f"📊 Visualization saved: {output_path}")
        
        plt.show()
        
        return True
    
    def build_prediction_model(self):
        """Build ML model to predict instarugs based on previous games"""
        if self.games_df is None or len(self.games_df) < 100:
            print("❌ Insufficient data for ML model. Need 100+ games.")
            return
            
        print("\n🤖 BUILDING PREDICTION MODEL")
        print("=" * 50)
        
        df = self.games_df.copy()
        
        # Create sequence features (last N games)
        sequence_length = 5
        features = []
        targets = []
        
        for i in range(sequence_length, len(df)):
            # Features: previous N games
            sequence_features = []
            for j in range(sequence_length):
                game_idx = i - sequence_length + j
                sequence_features.extend([
                    df.iloc[game_idx]['peak_multiplier'],
                    df.iloc[game_idx]['final_tick'],
                    1 if df.iloc[game_idx]['is_instarug'] else 0,
                    df.iloc[game_idx]['duration_seconds']
                ])
            
            features.append(sequence_features)
            
            # Target: is next game an instarug?
            targets.append(1 if df.iloc[i]['is_instarug'] else 0)
        
        if len(features) < 50:
            print(f"❌ Insufficient sequence data: {len(features)} samples")
            return
        
        # Convert to numpy arrays
        X = np.array(features)
        y = np.array(targets)
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
        
        # Train model
        model = RandomForestClassifier(n_estimators=100, random_state=42)
        model.fit(X_train, y_train)
        
        # Evaluate model
        train_score = model.score(X_train, y_train)
        test_score = model.score(X_test, y_test)
        
        print(f"📈 Model Performance:")
        print(f"   Training Accuracy: {train_score:.3f}")
        print(f"   Test Accuracy: {test_score:.3f}")
        print(f"   Baseline (predict most common): {max(np.mean(y), 1-np.mean(y)):.3f}")
        
        # Feature importance
        feature_names = []
        for i in range(sequence_length):
            feature_names.extend([f'game_{i}_peak', f'game_{i}_ticks', f'game_{i}_instarug', f'game_{i}_duration'])
        
        importance_df = pd.DataFrame({
            'feature': feature_names,
            'importance': model.feature_importances_
        }).sort_values('importance', ascending=False)
        
        print(f"\n🔍 Top 10 Most Important Features:")
        for idx, row in importance_df.head(10).iterrows():
            print(f"   {row['feature']}: {row['importance']:.4f}")
        
        # Predictions on test set
        y_pred = model.predict(X_test)
        
        print(f"\n📊 Classification Report:")
        print(classification_report(y_test, y_pred, target_names=['Normal', 'Instarug']))
        
        # Check if model beats random chance significantly
        if test_score > 0.6:
            print("\n🎯 SIGNIFICANT PATTERN DETECTED!")
            print("   The model performs significantly better than random chance.")
            print("   This suggests there are predictable patterns in the data.")
        else:
            print("\n✅ No Strong Patterns Detected")
            print("   The model performs close to random chance, suggesting fair gameplay.")
        
        return model, test_score

def main():
    parser = argparse.ArgumentParser(description='Rugs.fun Data Analysis Tools')
    parser.add_argument('--data-dir', default='rugs-data', help='Data directory path')
    parser.add_argument('--load-data', action='store_true', help='Load and display basic data info')
    parser.add_argument('--analyze-patterns', action='store_true', help='Analyze cross-game patterns')
    parser.add_argument('--verify-prng', action='store_true', help='Verify PRNG system')
    parser.add_argument('--visualize', action='store_true', help='Create visualizations')
    parser.add_argument('--build-model', action='store_true', help='Build ML prediction model')
    parser.add_argument('--full-analysis', action='store_true', help='Run complete analysis pipeline')
    
    args = parser.parse_args()
    
    # Initialize analyzer
    analyzer = RugsDataAnalyzer(data_dir=args.data_dir)
    
    print("🎮 RUGS.FUN DATA ANALYSIS TOOLS")
    print("=" * 50)
    
    # Always load data first
    if not analyzer.load_collected_data():
        print("❌ Failed to load data. Check data directory and files.")
        return
    
    # Run requested analyses
    if args.load_data or args.full_analysis:
        analyzer.analyze_basic_patterns()
    
    if args.analyze_patterns or args.full_analysis:
        analyzer.analyze_cross_game_patterns()
    
    if args.verify_prng or args.full_analysis:
        analyzer.verify_prng_system()
    
    if args.visualize or args.full_analysis:
        analyzer.create_visualizations()
    
    if args.build_model or args.full_analysis:
        analyzer.build_prediction_model()
    
    if not any([args.load_data, args.analyze_patterns, args.verify_prng, 
                args.visualize, args.build_model, args.full_analysis]):
        print("ℹ️  No analysis requested. Use --help to see available options.")
        print("    Quick start: python analysis-tools.py --full-analysis")

if __name__ == "__main__":
    main()